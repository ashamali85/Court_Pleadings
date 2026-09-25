import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import type { NextRequest } from 'next/server'
import {
  ACCEPTED_MIME_TYPES,
  blobFolder,
  isAttachmentKind,
  isDraftKey,
  MAX_ATTACHMENT_BYTES,
} from '@/lib/attachments'
import { getCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Issues a short-lived token so the browser can upload straight to the private
 * blob store.
 *
 * The file never passes through this function, which is the point: a Vercel
 * function caps a request body at 4.5MB and a phone photo of a lease is often
 * larger. What this route decides is *whether* an upload may happen and under
 * what constraints — the session, the allowed types, the size ceiling and the
 * destination path are all fixed here, server-side, where the browser cannot
 * change them.
 *
 * The row is written by /api/attachments/confirm rather than by Vercel's
 * onUploadCompleted webhook, because that webhook cannot reach a machine
 * running `next dev`. Confirmation re-derives the path prefix from the session
 * and verifies the blob with head(), so it is no weaker than the webhook.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      token: env.BLOB_READ_WRITE_TOKEN,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsed = JSON.parse(clientPayload ?? '{}') as {
          draftKey?: string
          kind?: string
        }
        const draftKey = (parsed.draftKey ?? '').trim()
        const kind = (parsed.kind ?? '').trim()

        if (!isDraftKey(draftKey)) throw new Error('bad draft key')
        if (!isAttachmentKind(kind)) throw new Error('unknown attachment kind')

        // the client asks for a path; it only gets one under its own folder
        const folder = blobFolder(user.id, draftKey)
        if (!pathname.startsWith(`${folder}/`)) {
          throw new Error('pathname outside this client’s folder')
        }

        return {
          allowedContentTypes: [...ACCEPTED_MIME_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: true,
        }
      },
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload refused'
    return Response.json({ error: message }, { status: 400 })
  }
}
