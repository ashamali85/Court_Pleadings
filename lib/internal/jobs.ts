/**
 * الأعمال الداخلية — the work the office does for itself, as opposed to the
 * requests clients send in.
 *
 * This is the registry and nothing else: a job is a slug, a name, and a line
 * saying what it is for. Adding one is a single entry here, and its page then
 * exists at /admin/internal/<slug> without another file being touched.
 *
 * The entries below are placeholders, standing in until the office says what
 * belongs here. They carry `placeholder: true`, which is what makes the list
 * and the page say plainly that nothing has been built yet rather than
 * pretending otherwise.
 */
export type InternalJob = {
  /** the URL segment, and the key its wording hangs off */
  slug: string
  titleAr: string
  descriptionAr: string
  /** named but not built yet */
  placeholder?: boolean
}

export const INTERNAL_JOBS: InternalJob[] = [
  {
    slug: 'job-1',
    titleAr: 'عمل داخلي (1)',
    descriptionAr: 'في انتظار تحديد هذا العمل من المكتب.',
    placeholder: true,
  },
  {
    slug: 'job-2',
    titleAr: 'عمل داخلي (2)',
    descriptionAr: 'في انتظار تحديد هذا العمل من المكتب.',
    placeholder: true,
  },
  {
    slug: 'job-3',
    titleAr: 'عمل داخلي (3)',
    descriptionAr: 'في انتظار تحديد هذا العمل من المكتب.',
    placeholder: true,
  },
]

export function getInternalJob(slug: string): InternalJob | undefined {
  return INTERNAL_JOBS.find((job) => job.slug === slug)
}

/** `internal.job.<slug>.name` / `.description` — so the office can reword both */
export function jobContentKey(job: InternalJob, part: 'name' | 'description') {
  return `internal.job.${job.slug}.${part}`
}
