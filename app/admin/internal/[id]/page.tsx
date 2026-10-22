import Link from 'next/link'
import { notFound } from 'next/navigation'
import ContractForm from '@/app/admin/internal/[id]/contract-form'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { applyContentToSections, getContent, translator } from '@/lib/content'
import { CONTRACT_FORM_KEY } from '@/lib/contracts/criminal-defense/form'
import { getInternalForm } from '@/lib/contracts'
import { getJob, isPlanned } from '@/lib/internal/jobs'

export const dynamic = 'force-dynamic'

/** which route returns the finished document, per linked form */
const ENDPOINTS: Record<string, string> = {
  [CONTRACT_FORM_KEY]: '/api/contracts/criminal-defense',
}

/**
 * One internal job's own page. Every job the office enters has one of these at
 * /admin/internal/<id>; what goes inside it is decided by the form the job is
 * linked to on the maintenance screen, and a job linked to nothing says so
 * rather than guessing.
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

  const form = getInternalForm(job.feature)
  const endpoint = form ? ENDPOINTS[form.key] : undefined

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

          {form && endpoint ? (
            <ContractForm
              endpoint={endpoint}
              sections={applyContentToSections(form, content)}
              defaults={form.defaults}
              labels={{
                generate: t('contract.generateBtn'),
                generating: t('contract.generateLoading'),
                generateHint: t('contract.generateHint'),
                generated: t('contract.generated'),
                failed: t('contract.failed'),
                blank: t('contract.blankBtn'),
                blankHint: t('contract.blankHint'),
                notStored: t('contract.notStored'),
                needsFix: t('message.needsFix'),
                fixFields: t('message.fixFields'),
              }}
            />
          ) : (
            <div className="card">
              {isPlanned(job) ? (
                <>
                  <h2>{t('admin.internal.planned')}</h2>
                  <p className="muted">{t('admin.internal.plannedHint')}</p>
                </>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
