import Link from 'next/link'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import { getContent, templateName, translator } from '@/lib/content'
import db from '@/lib/db'
import { statusBadge } from '@/lib/status'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string }>
}) {
  const user = await requireUser()
  const content = await getContent()
  const t = translator(content)
  const { submitted, updated } = await searchParams

  const requests = await db.caseRequest.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { documents: { orderBy: { version: 'desc' }, take: 1 } },
  })

  return (
    <>
      <Topbar user={user} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('client.list.title')}</h1>
              <p className="muted">{t('client.list.subtitle')}</p>
            </div>
            <Link className="btn" href="/requests/new">
              {t('client.list.newBtn')}
            </Link>
          </div>

          {submitted ? (
            <div className="alert ok">{t('message.submitted', { ref: submitted })}</div>
          ) : null}
          {updated ? (
            <div className="alert ok">{t('message.updated', { ref: updated })}</div>
          ) : null}

          <div className="card">
            {requests.length === 0 ? (
              <div className="empty">{t('client.list.empty')}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('client.list.colRef')}</th>
                    <th>{t('client.list.colType')}</th>
                    <th>{t('client.list.colDate')}</th>
                    <th>{t('client.list.colStatus')}</th>
                    <th>{t('client.list.colDoc')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const badge = statusBadge(r.status)
                    const doc = r.documents[0]
                    const template = getTemplate(r.templateKey)
                    const rejected = r.status === 'REJECTED'
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="ref">{r.reference}</span>
                        </td>
                        <td>
                          {template ? templateName(template, content) : r.templateKey}
                        </td>
                        <td>{r.createdAt.toLocaleDateString('ar-KW')}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>
                            {t(`status.${r.status}`)}
                          </span>
                          {rejected && r.lawyerNote ? (
                            <div className="reject-note">
                              <strong>{t('client.list.rejectionLabel')}:</strong>{' '}
                              {r.lawyerNote}
                              <div style={{ marginTop: 10 }}>
                                <Link
                                  className="btn secondary"
                                  href={`/requests/${r.id}/edit`}
                                >
                                  {t('client.list.editBtn')}
                                </Link>
                              </div>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {doc ? (
                            <a href={`/api/documents/${doc.id}`}>
                              {t('common.download')} ({doc.version})
                            </a>
                          ) : (
                            <span className="hint">{t('common.none')}</span>
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
