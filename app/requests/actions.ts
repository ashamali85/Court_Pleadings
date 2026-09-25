'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isDraftKey } from '@/lib/attachments'
import { audit } from '@/lib/audit'
import { requireUser } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { nextReference } from '@/lib/counter'
import db from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma/client'
import { notifyAdminOfNewRequest } from '@/lib/notify'
import { formDataToValues, getTemplate } from '@/lib/templates'

export type RequestFormState = {
  error?: string
  errors?: Record<string, string>
  values?: Record<string, unknown>
}

function collectIssues(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    // a row field reports at plaintiff_heirs.0.civil_id, so keep the whole path
    // for the input that is wrong, and the head for the group it belongs to
    const path = issue.path.map(String)
    const full = path.join('.')
    const head = path[0] ?? ''
    if (full && !errors[full]) errors[full] = issue.message
    if (head && !errors[head]) errors[head] = issue.message
  }
  return errors
}

/**
 * A file is uploaded the moment the client picks it, which is before the
 * request exists — so it waits under the draft key until there is a request to
 * belong to. Only rows uploaded by this user are ever adopted, so a guessed
 * key cannot pull another client's file into your request.
 */
async function adoptDraftAttachments(
  tx: Prisma.TransactionClient,
  draftKey: string,
  userId: string,
  requestId: string,
): Promise<number> {
  if (!isDraftKey(draftKey)) return 0
  const { count } = await tx.attachment.updateMany({
    where: { draftKey, uploadedById: userId, requestId: null },
    data: { requestId, draftKey: null },
  })
  return count
}

export async function submitRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  // Server Functions are reachable directly, so authorisation is re-checked here.
  const user = await requireUser()
  const t = translator(await getContent())

  const templateKey = (formData.get('templateKey') ?? '').toString()
  const template = getTemplate(templateKey)
  if (!template) return { error: t('message.notFound') }

  const raw = formDataToValues(template, formData)
  const parsed = template.schema.safeParse(raw)

  if (!parsed.success) {
    return {
      error: t('message.fixFields'),
      errors: collectIssues(parsed.error.issues),
      values: raw,
    }
  }

  const clientNote = (formData.get('clientNote') ?? '').toString().trim().slice(0, 2000)

  const draftKey = (formData.get('draftKey') ?? '').toString()

  const created = await db.$transaction<{ id: string; reference: string }>(
    async (tx: Prisma.TransactionClient) => {
      const reference = await nextReference(tx)
      const request = await tx.caseRequest.create({
        data: {
          reference,
          templateKey: template.key,
          clientId: user.id,
          data: parsed.data as unknown as Prisma.InputJsonValue,
          clientNote: clientNote || null,
        },
        select: { id: true, reference: true },
      })
      await adoptDraftAttachments(tx, draftKey, user.id, request.id)
      return request
    },
  )

  await audit({
    actorId: user.id,
    action: 'request.submitted',
    entity: 'CaseRequest',
    entityId: created.id,
    meta: { reference: created.reference, templateKey: template.key },
  })

  await notifyAdminOfNewRequest({
    reference: created.reference,
    clientName: user.fullName,
    templateName: template.nameAr,
  })

  revalidatePath('/requests')
  redirect(`/requests?submitted=${encodeURIComponent(created.reference)}`)
}

/** A returned request can be corrected by its owner and sent back. */
export async function updateRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const user = await requireUser()
  const t = translator(await getContent())

  const requestId = (formData.get('requestId') ?? '').toString()
  const request = await db.caseRequest.findUnique({ where: { id: requestId } })

  // owner-only, and only while the request is sitting with the client
  if (!request || request.clientId !== user.id || request.status !== 'REJECTED') {
    return { error: t('message.notFound') }
  }

  const template = getTemplate(request.templateKey)
  if (!template) return { error: t('message.notFound') }

  const raw = formDataToValues(template, formData)
  const parsed = template.schema.safeParse(raw)

  if (!parsed.success) {
    return {
      error: t('message.fixFields'),
      errors: collectIssues(parsed.error.issues),
      values: raw,
    }
  }

  const clientNote = (formData.get('clientNote') ?? '').toString().trim().slice(0, 2000)

  // a returned request may come back with files the client has since added
  await adoptDraftAttachments(
    db as unknown as Prisma.TransactionClient,
    (formData.get('draftKey') ?? '').toString(),
    user.id,
    requestId,
  )

  await db.caseRequest.update({
    where: { id: requestId },
    data: {
      data: parsed.data as unknown as Prisma.InputJsonValue,
      clientNote: clientNote || null,
      status: 'SUBMITTED',
    },
  })

  await audit({
    actorId: user.id,
    action: 'request.resubmitted',
    entity: 'CaseRequest',
    entityId: requestId,
    meta: { reference: request.reference },
  })

  await notifyAdminOfNewRequest({
    reference: request.reference,
    clientName: user.fullName,
    templateName: template.nameAr,
  })

  revalidatePath('/requests')
  revalidatePath('/admin')
  redirect(`/requests?updated=${encodeURIComponent(request.reference)}`)
}
