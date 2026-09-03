'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import db from '@/lib/db'
import { renderDocx } from '@/lib/docgen'
import { notifyClientOfStatus } from '@/lib/notify'
import { formDataToOverrides, formDataToValues, getTemplate } from '@/lib/templates'

export type ReviewState = {
  error?: string
  errors?: Record<string, string>
  ok?: string
}

async function loadForReview(requestId: string) {
  const request = await db.caseRequest.findUnique({
    where: { id: requestId },
    include: { client: true, template: true, documents: true },
  })
  if (!request) return null
  const template = getTemplate(request.templateKey)
  if (!template) return null
  return { request, template }
}

/** Saves the lawyer's corrections without producing a document. */
export async function saveReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin()
  const requestId = (formData.get('requestId') ?? '').toString()

  const loaded = await loadForReview(requestId)
  if (!loaded) return { error: 'الطلب غير موجود' }

  const parsed = loaded.template.schema.safeParse(
    formDataToValues(loaded.template, formData),
  )
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !errors[key]) errors[key] = issue.message
    }
    return { error: 'يرجى تصحيح الحقول المميزة.', errors }
  }

  const overrides = formDataToOverrides(loaded.template, formData)

  await db.caseRequest.update({
    where: { id: requestId },
    data: {
      reviewedData: { values: parsed.data, overrides } as object,
      status: loaded.request.status === 'SUBMITTED' ? 'UNDER_REVIEW' : loaded.request.status,
      lawyerNote: (formData.get('lawyerNote') ?? '').toString().trim() || null,
    },
  })

  await audit({
    actorId: admin.id,
    action: 'request.reviewed',
    entity: 'CaseRequest',
    entityId: requestId,
    meta: { reference: loaded.request.reference },
  })

  revalidatePath(`/admin/requests/${requestId}`)
  return { ok: 'تم حفظ التعديلات.' }
}

/** Saves corrections and produces the .docx. */
export async function generateDocument(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin()
  const requestId = (formData.get('requestId') ?? '').toString()

  const loaded = await loadForReview(requestId)
  if (!loaded) return { error: 'الطلب غير موجود' }

  const parsed = loaded.template.schema.safeParse(
    formDataToValues(loaded.template, formData),
  )
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !errors[key]) errors[key] = issue.message
    }
    return { error: 'لا يمكن إصدار الصحيفة قبل تصحيح الحقول المميزة.', errors }
  }

  const overrides = formDataToOverrides(loaded.template, formData)
  const placeholders = loaded.template.derive(parsed.data, overrides)

  let bytes: Uint8Array<ArrayBuffer>
  try {
    bytes = renderDocx(loaded.request.template.docx, placeholders)
  } catch (error) {
    console.error('[generate] render failed', error)
    return { error: error instanceof Error ? error.message : 'تعذر إنشاء المستند' }
  }

  const version = loaded.request.documents.length + 1
  const filename = `${loaded.template.filenamePrefix}-${loaded.request.reference}-v${version}.docx`

  await db.$transaction([
    db.document.create({
      data: {
        requestId,
        version,
        filename,
        bytes,
        generatedById: admin.id,
      },
    }),
    db.caseRequest.update({
      where: { id: requestId },
      data: {
        reviewedData: { values: parsed.data, overrides } as object,
        status: 'GENERATED',
        lawyerNote: (formData.get('lawyerNote') ?? '').toString().trim() || null,
      },
    }),
  ])

  await audit({
    actorId: admin.id,
    action: 'document.generated',
    entity: 'CaseRequest',
    entityId: requestId,
    meta: { reference: loaded.request.reference, version, filename },
  })

  await notifyClientOfStatus({
    to: loaded.request.client.email,
    reference: loaded.request.reference,
    statusAr: 'تم إصدار الصحيفة وهي متاحة للتحميل.',
    note: loaded.request.lawyerNote,
  })

  revalidatePath(`/admin/requests/${requestId}`)
  revalidatePath('/admin')
  return { ok: `تم إصدار الصحيفة (نسخة ${version}).` }
}

/** One entry point for the review form; the clicked button carries the intent. */
export async function submitReview(
  prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const intent = (formData.get('intent') ?? 'save').toString()
  return intent === 'generate'
    ? generateDocument(prev, formData)
    : saveReview(prev, formData)
}

export async function rejectRequest(formData: FormData) {
  const admin = await requireAdmin()
  const requestId = (formData.get('requestId') ?? '').toString()
  const note = (formData.get('lawyerNote') ?? '').toString().trim()

  const request = await db.caseRequest.findUnique({
    where: { id: requestId },
    include: { client: true },
  })
  if (!request) return

  await db.caseRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', lawyerNote: note || null },
  })

  await audit({
    actorId: admin.id,
    action: 'request.rejected',
    entity: 'CaseRequest',
    entityId: requestId,
    meta: { reference: request.reference, note },
  })

  await notifyClientOfStatus({
    to: request.client.email,
    reference: request.reference,
    statusAr: 'تمت إعادة الطلب، يرجى مراجعة ملاحظات المحامي.',
    note: note || null,
  })

  revalidatePath('/admin')
  redirect('/admin')
}
