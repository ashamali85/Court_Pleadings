import Link from 'next/link'
import { notFound } from 'next/navigation'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { getInternalJob, jobContentKey } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/**
 * One internal job's own page. Every job in the registry has one of these at
 * /admin/internal/<slug>; what goes inside it is the job's own business, and
 * until the office says what that is the page says so rather than guessing.
 */
export default async function InternalJobPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)

  const { slug } = await params
  const job = getInternalJob(slug)
  if (!job) notFound()

  const title = content[jobContentKey(job, 'name')] ?? job.titleAr
  const description = content[jobContentKey(job, 'description')] ?? job.descriptionAr

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{title}</h1>
              <p className="muted">{description}</p>
            </div>
            <Link className="btn secondary" href="/admin/internal">
              {t('admin.internal.back')}
            </Link>
          </div>

          <div className="card">
            {job.placeholder ? (
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
