import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReviewForm from '@/app/admin/requests/[id]/review-form'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import {
  applyContentToOverridable,
  applyContentToSections,
  getContent,
  templateName,
  translator,
} from '@/lib/content'
import db from '@/lib/db'
import { statusBadge } from '@/lib/status'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

type Reviewed = {
  values?: Record<string, unknown>
  overrides?: Record<string, string>
}

export default async function ReviewRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  const { id } = await params

  const request = await db.caseRequest.findUnique({
    where: { id },
    include: { client: true, documents: { orderBy: { version: 'desc' } } },
  })
  if (!request) notFound()

  const template = getTemplate(request.templateKey)
  if (!template) notFound()

  const content = await getContent()
  const t = translator(content)

  const reviewed = (request.reviewedData ?? {}) as Reviewed
  const values = {
    ...(request.data as Record<string, unknown>),
    ...(reviewed.values ?? {}),
  }
  const overrides = reviewed.overrides ?? {}
  const badge = statusBadge(request.status)

  // preview of the computed text, exactly as it will be written into the .docx
  let preview: Record<string, string> = {}
  const parsed = template.schema.safeParse(values)
  if (parsed.success) {
    const placeholders = template.derive(parsed.data, overrides)
    preview = Object.fromEntries(
      Object.entries(placeholders)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => [k, v as string]),
    )
  }

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>
                {t('client.list.colRef')}{' '}
                <span className="ref">{request.reference}</span>
              </h1>
              <p className="muted">
                {templateName(template, content)} · {request.client.fullName} ·{' '}
                {request.createdAt.toLocaleString('ar-KW')}
              </p>
              <span className={`badge ${badge.className}`}>
                {t(`status.${request.status}`)}
              </span>
            </div>
            <Link className="btn secondary" href="/admin">
              {t('admin.review.backBtn')}
            </Link>
          </div>

          {request.clientNote ? (
            <div className="card tinted">
              <div className="section-title">{t('admin.review.clientNoteTitle')}</div>
              <div className="preview">{request.clientNote}</div>
            </div>
          ) : null}

          {request.documents.length > 0 ? (
            <div className="card">
              <div className="section-title">{t('admin.review.docsTitle')}</div>
              <table>
                <thead>
                  <tr>
                    <th>{t('admin.review.colVersion')}</th>
                    <th>{t('admin.review.colFile')}</th>
                    <th>{t('admin.review.colIssued')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {request.documents.map(
                    (d: {
                      id: string
                      version: number
                      filename: string
                      createdAt: Date
                    }) => (
                      <tr key={d.id}>
                        <td>{d.version}</td>
                        <td dir="ltr">{d.filename}</td>
                        <td>{d.createdAt.toLocaleString('ar-KW')}</td>
                        <td>
                          <a href={`/api/documents/${d.id}`}>{t('common.download')}</a>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          <ReviewForm
            requestId={request.id}
            sections={applyContentToSections(template, content)}
            overridable={applyContentToOverridable(template, content)}
            values={values}
            overrides={overrides}
            lawyerNote={request.lawyerNote ?? ''}
            preview={preview}
            labels={{
              computedTitle: t('admin.review.computedTitle'),
              computedHint: t('admin.review.computedHint'),
              overrideTitle: t('admin.review.overrideTitle'),
              overrideHint: t('admin.review.overrideHint'),
              noteTitle: t('admin.review.noteTitle'),
              generate: t('admin.review.generateBtn'),
              generateLoading: t('admin.review.generateLoading'),
              save: t('admin.review.saveBtn'),
              loading: t('common.loading'),
              rejectTitle: t('admin.review.rejectTitle'),
              rejectReason: t('admin.review.rejectReasonLabel'),
              reject: t('admin.review.rejectBtn'),
              download: t('admin.review.downloadLink'),
              needsFix: t('message.needsFix'),
            }}
          />
        </div>
      </main>
    </>
  )
}
