import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReviewForm from '@/app/admin/requests/[id]/review-form'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import db from '@/lib/db'
import { statusBadge } from '@/lib/status'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

type Reviewed = { values?: Record<string, unknown>; overrides?: Record<string, string> }

export default async function ReviewRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  const { id } = await params

  const request = await db.caseRequest.findUnique({
    where: { id },
    include: {
      client: true,
      documents: { orderBy: { version: 'desc' } },
    },
  })
  if (!request) notFound()

  const template = getTemplate(request.templateKey)
  if (!template) notFound()

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
      <Topbar user={admin} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>
                الطلب <span className="ref">{request.reference}</span>
              </h1>
              <p className="muted">
                {template.nameAr} · مقدم الطلب: {request.client.fullName} ·{' '}
                {request.createdAt.toLocaleString('ar-KW')}
              </p>
              <span className={`badge ${badge.className}`}>{badge.labelAr}</span>
            </div>
            <Link className="btn secondary" href="/admin">
              رجوع للقائمة
            </Link>
          </div>

          {request.clientNote ? (
            <div className="card tinted">
              <div className="section-title">ملاحظات العميل</div>
              <div className="preview">{request.clientNote}</div>
            </div>
          ) : null}

          {request.documents.length > 0 ? (
            <div className="card">
              <div className="section-title">الصحف الصادرة</div>
              <table>
                <thead>
                  <tr>
                    <th>النسخة</th>
                    <th>اسم الملف</th>
                    <th>تاريخ الإصدار</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {request.documents.map((d: {
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
                        <a href={`/api/documents/${d.id}`}>تحميل</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <ReviewForm
            requestId={request.id}
            sections={template.sections}
            overridable={template.overridable}
            values={values}
            overrides={overrides}
            lawyerNote={request.lawyerNote ?? ''}
            preview={preview}
          />
        </div>
      </main>
    </>
  )
}
