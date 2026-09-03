import Link from 'next/link'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import db from '@/lib/db'
import { statusBadge } from '@/lib/status'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export default async function AdminInbox() {
  const admin = await requireAdmin()

  const requests = await db.caseRequest.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: { client: true, documents: { select: { id: true } } },
  })

  const pending = requests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
  ).length

  return (
    <>
      <Topbar user={admin} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>الطلبات الواردة</h1>
              <p className="muted">
                {pending > 0
                  ? `${pending} طلب بانتظار المراجعة والإصدار.`
                  : 'لا توجد طلبات معلقة.'}
              </p>
            </div>
          </div>

          <div className="card">
            {requests.length === 0 ? (
              <div className="empty">لم يرد أي طلب بعد.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>الرقم المرجعي</th>
                    <th>مقدم الطلب</th>
                    <th>نوع الصحيفة</th>
                    <th>ملخص</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const template = getTemplate(r.templateKey)
                    const badge = statusBadge(r.status)
                    let summary = '—'
                    try {
                      summary = template
                        ? template.summary(r.data as never)
                        : '—'
                    } catch {
                      summary = '—'
                    }
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="ref">{r.reference}</span>
                        </td>
                        <td>
                          {r.client.fullName}
                          <div className="hint" dir="ltr">
                            {r.client.email}
                          </div>
                        </td>
                        <td>{template?.nameAr ?? r.templateKey}</td>
                        <td>{summary}</td>
                        <td>{r.createdAt.toLocaleDateString('ar-KW')}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.labelAr}</span>
                        </td>
                        <td>
                          <Link href={`/admin/requests/${r.id}`}>مراجعة وإصدار</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
