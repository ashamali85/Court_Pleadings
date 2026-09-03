import Link from 'next/link'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import db from '@/lib/db'
import { getTemplate } from '@/lib/templates'
import { statusBadge } from '@/lib/status'

export const dynamic = 'force-dynamic'

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const user = await requireUser()
  const { submitted } = await searchParams

  const requests = await db.caseRequest.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { documents: { orderBy: { version: 'desc' }, take: 1 } },
  })

  return (
    <>
      <Topbar user={user} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>طلباتي</h1>
              <p className="muted">
                تابع حالة طلباتك، وحمّل الصحيفة بعد اعتمادها من المحامي.
              </p>
            </div>
            <Link className="btn" href="/requests/new">
              تقديم طلب جديد
            </Link>
          </div>

          {submitted ? (
            <div className="alert ok">
              تم استلام طلبك برقم <span className="ref">{submitted}</span>. سيتولى المحامي
              مراجعته وإعداد الصحيفة.
            </div>
          ) : null}

          <div className="card">
            {requests.length === 0 ? (
              <div className="empty">لا توجد طلبات بعد.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>الرقم المرجعي</th>
                    <th>نوع الصحيفة</th>
                    <th>تاريخ التقديم</th>
                    <th>الحالة</th>
                    <th>المستند</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const badge = statusBadge(r.status)
                    const doc = r.documents[0]
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="ref">{r.reference}</span>
                        </td>
                        <td>{getTemplate(r.templateKey)?.nameAr ?? r.templateKey}</td>
                        <td>{r.createdAt.toLocaleDateString('ar-KW')}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.labelAr}</span>
                          {r.lawyerNote ? (
                            <div className="hint">ملاحظة المحامي: {r.lawyerNote}</div>
                          ) : null}
                        </td>
                        <td>
                          {doc ? (
                            <a href={`/api/documents/${doc.id}`}>تحميل (نسخة {doc.version})</a>
                          ) : (
                            <span className="hint">—</span>
                          )}
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
