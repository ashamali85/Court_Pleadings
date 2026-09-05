import Link from 'next/link'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, templateName, translator } from '@/lib/content'
import db from '@/lib/db'
import { statusBadge } from '@/lib/status'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export default async function AdminInbox() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)

  const requests = await db.caseRequest.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: { client: true },
  })

  const pending = requests.filter(
    (r: { status: string }) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
  ).length

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('admin.inbox.title')}</h1>
              <p className="muted">
                {pending > 0
                  ? `${pending} ${t('admin.inbox.pending')}`
                  : t('admin.inbox.noPending')}
              </p>
            </div>
          </div>

          <div className="card">
            {requests.length === 0 ? (
              <div className="empty">{t('admin.inbox.empty')}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('client.list.colRef')}</th>
                    <th>{t('admin.inbox.colClient')}</th>
                    <th>{t('client.list.colType')}</th>
                    <th>{t('admin.inbox.colSummary')}</th>
                    <th>{t('client.list.colDate')}</th>
                    <th>{t('client.list.colStatus')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const template = getTemplate(r.templateKey)
                    const badge = statusBadge(r.status)
                    let summary = t('common.none')
                    try {
                      if (template) summary = template.summary(r.data as never)
                    } catch {
                      summary = t('common.none')
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
                        <td>
                          {template ? templateName(template, content) : r.templateKey}
                        </td>
                        <td>{summary}</td>
                        <td>{r.createdAt.toLocaleDateString('ar-KW')}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>
                            {t(`status.${r.status}`)}
                          </span>
                        </td>
                        <td>
                          <Link href={`/admin/requests/${r.id}`}>
                            {t('admin.inbox.reviewLink')}
                          </Link>
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
