import { del, get } from '@vercel/blob'
import type { NextRequest } from 'next/server'
import { audit } from '@/lib/audit'
import { attachmentLabel } from '@/lib/attachments'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * The store is private, so its URLs are not public and a blob can only be read
 * with the store's credentials. That makes this function the one door, and the
 * rule it enforces is the same one the document download uses: the client who
 * owns the request, or the lawyer. Nobody else, including a client who happens
 * to know another request's attachment id.
 */
async function load(id: string) {
  return db.attachment.findUnique({
    where: { id },
    include: {
      request: { select: { clientId: true, reference: true, status: true } },
    },
  })
}

/** the lawyer, or the client the file belongs to — nobody else */
function mayTouch(
  uploadedById: string,
  clientId: string | null,
  user: { id: string; role: string },
): boolean {
  if (user.role === 'ADMIN') return true
  // still a draft, so it belongs to whoever uploaded it
  if (clientId === null) return uploadedById === user.id
  return clientId === user.id
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await context.params
  const attachment = await load(id)
  if (!attachment) return new Response('Not found', { status: 404 })
  if (!mayTouch(attachment.uploadedById, attachment.request?.clientId ?? null, user)) {
    return new Response('Forbidden', { status: 403 })
  }

  const blob = await get(attachment.blobPath, {
    access: 'private',
    token: env.BLOB_READ_WRITE_TOKEN,
  })
  if (!blob?.stream) return new Response('Not found', { status: 404 })

  await audit({
    actorId: user.id,
    action: 'attachment.downloaded',
    entity: 'Attachment',
    entityId: attachment.id,
    meta: {
      kind: attachment.kind,
      reference: attachment.request?.reference ?? null,
    },
  })

  // RFC 5987, because these filenames are Arabic
  const name = encodeURIComponent(attachment.filename)
  return new Response(blob.stream, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Length': String(attachment.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${name}`,
      // a private document should not sit in a shared cache
      'Cache-Control': 'private, no-store',
    },
  })
}

/**
 * Removing an attachment. A client may take back what they sent while the
 * request is still theirs to change; once the lawyer has issued the صحيفة the
 * file is part of the record and only the lawyer may remove it.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await context.params
  const attachment = await load(id)
  if (!attachment) return new Response('Not found', { status: 404 })
  if (!mayTouch(attachment.uploadedById, attachment.request?.clientId ?? null, user)) {
    return new Response('Forbidden', { status: 403 })
  }

  const locked =
    attachment.request &&
    attachment.request.status === 'GENERATED' &&
    user.role !== 'ADMIN'
  if (locked) {
    return Response.json(
      { error: 'لا يمكن حذف المرفق بعد إصدار الصحيفة' },
      { status: 409 },
    )
  }

  await del(attachment.blobPath, { token: env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
  await db.attachment.delete({ where: { id: attachment.id } })

  await audit({
    actorId: user.id,
    action: 'attachment.deleted',
    entity: 'Attachment',
    entityId: attachment.id,
    meta: {
      kind: attachment.kind,
      label: attachmentLabel(attachment.kind),
      reference: attachment.request?.reference ?? null,
    },
  })

  return Response.json({ ok: true })
}
