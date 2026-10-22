import Link from 'next/link'
import { notFound } from 'next/navigation'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { getJob, isPlanned } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/**
 * One internal job's own page. Every job the office enters has one of these at
 * /admin/internal/<id>; what goes inside it is the job's own business, and
 * until the office says what that is the page says so rather than guessing.
 */
export default async function InternalJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)

  const { id } = await params
  const job = await getJob(id)
  if (!job) notFound()

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{job.titleAr}</h1>
              {job.descriptionAr ? <p className="muted">{job.descriptionAr}</p> : null}
            </div>
            <Link className="btn secondary" href="/admin/internal">
              {t('admin.internal.back')}
            </Link>
          </div>

          {!job.active ? (
            <div className="alert warn">{t('admin.jobs.hiddenNotice')}</div>
          ) : null}

          <div className="card">
            {isPlanned(job) ? (
              <>
                <h2>{t('admin.internal.planned')}</h2>
                <p className="muted">{t('admin.internal.plannedHint')}</p>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}
