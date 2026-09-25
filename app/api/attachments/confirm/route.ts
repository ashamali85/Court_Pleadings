import { del, head } from '@vercel/blob'
import type { NextRequest } from 'next/server'
import { audit } from '@/lib/audit'
import {
  ACCEPTED_MIME_TYPES,
  blobFolder,
  isAttachmentKind,
  isDraftKey,
  MAX_ATTACHMENT_BYTES,
  safeFilename,
} from '@/lib/attachments'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Records an upload that has just landed in the blob store.
 *
 * Nothing here trusts the browser. The folder prefix is rebuilt from the
 * session, so a client cannot claim another client's file; head() proves the
 * blob exists and reports its real size and type, so a forged body cannot
 * invent either. The only thing taken from the request is the original
 * filename, which is sanitised and used for display.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    pathname?: string
    kind?: string
    draftKey?: string
    filename?: string
  }

  const pathname = (body.pathname ?? '').trim()
  const kind = (body.kind ?? '').trim()
  const draftKey = (body.draftKey ?? '').trim()

  if (!isDraftKey(draftKey) || !isAttachmentKind(kind) || !pathname) {
    return Response.json({ error: 'طلب غير صالح' }, { status: 400 })
  }
  if (!pathname.startsWith(`${blobFolder(user.id, draftKey)}/`)) {
    return Response.json({ error: 'غير مصرح بهذا الملف' }, { status: 403 })
  }

  const token = env.BLOB_READ_WRITE_TOKEN

  // the store is the authority on what was actually stored
  let meta
  try {
    meta = await head(pathname, { token })
  } catch {
    return Response.json({ error: 'لم يتم العثور على الملف' }, { status: 404 })
  }

  if (meta.size > MAX_ATTACHMENT_BYTES) {
    await del(pathname, { token })
    return Response.json({ error: 'حجم الملف أكبر من المسموح' }, { status: 400 })
  }
  if (!ACCEPTED_MIME_TYPES.includes(meta.contentType as never)) {
    await del(pathname, { token })
    return Response.json({ error: 'نوع الملف غير مقبول' }, { status: 400 })
  }

  // one file per kind: replacing means the old blob goes too, not just its row
  const previous = await db.attachment.findMany({
    where: { draftKey, kind, requestId: null, uploadedById: user.id },
  })
  for (const old of previous) {
    await del(old.blobPath, { token }).catch(() => {})
  }
  if (previous.length) {
    await db.attachment.deleteMany({ where: { id: { in: previous.map((p) => p.id) } } })
  }

  const created = await db.attachment.create({
    data: {
      draftKey,
      kind,
      filename: safeFilename(body.filename ?? pathname.split('/').pop() ?? 'ملف'),
      mimeType: meta.contentType,
      size: meta.size,
      blobPath: pathname,
      uploadedById: user.id,
    },
  })

  await audit({
    actorId: user.id,
    action: 'attachment.uploaded',
    entity: 'Attachment',
    entityId: created.id,
    meta: { kind, size: meta.size, mimeType: meta.contentType },
  })

  return Response.json({
    id: created.id,
    kind: created.kind,
    filename: created.filename,
    size: created.size,
  })
}
