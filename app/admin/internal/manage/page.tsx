import Link from 'next/link'
import JobsManager from '@/app/admin/internal/manage/jobs-manager'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { listAllJobs } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/** Where the list of الأعمال الداخلية is created and kept. */
export default async function ManageJobsPage() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)
  const jobs = await listAllJobs()

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('admin.jobs.title')}</h1>
              <p className="muted">{t('admin.jobs.subtitle')}</p>
            </div>
            <Link className="btn secondary" href="/admin/internal">
              {t('admin.internal.back')}
            </Link>
          </div>

          <JobsManager
            jobs={jobs}
            labels={{
              addTitle: t('admin.jobs.addTitle'),
              addHint: t('admin.jobs.addHint'),
              name: t('admin.jobs.name'),
              description: t('admin.jobs.description'),
              add: t('admin.jobs.add'),
              save: t('common.save'),
              visible: t('admin.jobs.visible'),
              visibleHint: t('admin.jobs.visibleHint'),
              moveUp: t('admin.jobs.moveUp'),
              moveDown: t('admin.jobs.moveDown'),
              remove: t('admin.jobs.remove'),
              confirmRemove: t('admin.jobs.confirmRemove'),
              cancel: t('admin.jobs.cancel'),
              loading: t('common.loading'),
              empty: t('admin.jobs.empty'),
              hidden: t('admin.jobs.hidden'),
              openJob: t('admin.jobs.openJob'),
            }}
          />
        </div>
      </main>
    </>
  )
}
