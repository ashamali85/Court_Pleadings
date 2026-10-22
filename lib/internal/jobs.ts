/**
 * الأعمال الداخلية — the office's own work, as opposed to the requests clients
 * send in.
 *
 * The list is the lawyer's to maintain on /admin/internal/manage, so it lives
 * in the database: adding a job is a row, and its page exists at
 * /admin/internal/<id> the moment it is saved. Nothing here needs a deploy.
 *
 * A job named but not yet built says so on its own page — see `isPlanned`.
 */
import 'server-only'
import { getInternalForm } from '@/lib/contracts'
import db from '@/lib/db'

export type InternalJob = {
  id: string
  titleAr: string
  descriptionAr: string | null
  /** key of the built-in form this job opens, or null while it is a stub */
  feature: string | null
  position: number
  active: boolean
}

const SELECT = {
  id: true,
  titleAr: true,
  descriptionAr: true,
  feature: true,
  position: true,
  active: true,
} as const

/** the order the list shows them in: the lawyer's own, then oldest first */
const ORDER = [{ position: 'asc' as const }, { createdAt: 'asc' as const }]

/** what the lawyer sees on /admin/internal — the ones they have not hidden */
export async function listActiveJobs(): Promise<InternalJob[]> {
  return db.internalJob.findMany({
    where: { active: true },
    orderBy: ORDER,
    select: SELECT,
  })
}

/** what the maintenance page sees: everything, hidden ones included */
export async function listAllJobs(): Promise<InternalJob[]> {
  return db.internalJob.findMany({ orderBy: ORDER, select: SELECT })
}

export async function getJob(id: string): Promise<InternalJob | null> {
  return db.internalJob.findUnique({ where: { id }, select: SELECT })
}

/**
 * A job with nothing built behind it yet: its page says «قيد الإعداد».
 *
 * A job is no longer a stub once it is linked to one of the built-in forms in
 * lib/contracts — that link is what its page renders. A job the lawyer added
 * themselves and left unlinked is still a named intention, and says so.
 */
export function isPlanned(job: InternalJob): boolean {
  return !getInternalForm(job.feature)
}

export const JOB_TITLE_MAX = 120
export const JOB_DESCRIPTION_MAX = 400
