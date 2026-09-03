import type { NextRequest } from 'next/server'
import { audit } from '@/lib/audit'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * The only route handler in the app. A binary download cannot travel through a
 * server action's response, so the generated .docx is streamed from here — the
 * same authorisation rules as the pages apply.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await context.params
  const doc = await db.document.findUnique({
    where: { id },
    include: { request: { select: { clientId: true, reference: true } } },
  })
  if (!doc) return new Response('Not found', { status: 404 })

  const isOwner = doc.request.clientId === user.id
  if (user.role !== 'ADMIN' && !isOwner) {
    return new Response('Forbidden', { status: 403 })
  }

  await audit({
    actorId: user.id,
    action: 'document.downloaded',
    entity: 'Document',
    entityId: doc.id,
    meta: { reference: doc.request.reference, version: doc.version },
  })

  return new Response(new Uint8Array(doc.bytes), {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.filename}"`,
      'Content-Length': String(doc.bytes.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
