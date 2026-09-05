'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
    const key = String(issue.path[0] ?? '')
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
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

  const created = await db.$transaction<{ id: string; reference: string }>(
    async (tx: Prisma.TransactionClient) => {
      const reference = await nextReference(tx)
      return tx.caseRequest.create({
        data: {
          reference,
          templateKey: template.key,
          clientId: user.id,
          data: parsed.data as unknown as Prisma.InputJsonValue,
          clientNote: clientNote || null,
        },
        select: { id: true, reference: true },
      })
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
