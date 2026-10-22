import Link from 'next/link'
import { EmptyArt } from '@/components/brand'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { isPlanned, listActiveJobs } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/** الأعمال الداخلية — pick the job, then do it on its own page. */
export default async function InternalJobsPage() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)
  const jobs = await listActiveJobs()

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('nav.internal')}</h1>
              <p className="muted">{t('admin.internal.subtitle')}</p>
            </div>
            <Link className="btn secondary" href="/admin/internal/manage">
              {t('admin.jobs.title')}
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="card">
              <div className="empty">
                <EmptyArt className="empty-art" />
                <p>{t('admin.internal.empty')}</p>
                <Link className="btn" href="/admin/internal/manage">
                  {t('admin.jobs.addFirst')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="choice-list">
              {jobs.map((job) => (
                <div className="choice-card" key={job.id}>
                  <Link className="choice-name" href={`/admin/internal/${job.id}`}>
                    {job.titleAr}
                  </Link>
                  {job.descriptionAr ? (
                    <span className="choice-desc">{job.descriptionAr}</span>
                  ) : null}
                  {isPlanned(job) ? (
                    <span className="choice-note">{t('admin.internal.planned')}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
