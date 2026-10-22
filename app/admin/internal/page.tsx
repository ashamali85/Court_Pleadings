import Link from 'next/link'
import { EmptyArt } from '@/components/brand'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { INTERNAL_JOBS, jobContentKey } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/** الأعمال الداخلية — pick the job, then do it on its own page. */
export default async function InternalJobsPage() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)

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
          </div>

          {INTERNAL_JOBS.length === 0 ? (
            <div className="card">
              <div className="empty">
                <EmptyArt className="empty-art" />
                <p>{t('admin.internal.empty')}</p>
              </div>
            </div>
          ) : (
            <div className="choice-list">
              {INTERNAL_JOBS.map((job) => (
                <div className="choice-card" key={job.slug}>
                  <Link className="choice-name" href={`/admin/internal/${job.slug}`}>
                    {content[jobContentKey(job, 'name')] ?? job.titleAr}
                  </Link>
                  <span className="choice-desc">
                    {content[jobContentKey(job, 'description')] ?? job.descriptionAr}
                  </span>
                  {job.placeholder ? (
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
