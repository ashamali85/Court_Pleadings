'use server'

import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import { isInternalFormKey } from '@/lib/contracts'
import db from '@/lib/db'
import { JOB_DESCRIPTION_MAX, JOB_TITLE_MAX } from '@/lib/internal/jobs'

export type JobsState = { error?: string; ok?: string; fieldError?: string }

const text = (form: FormData, key: string, max: number) =>
  (form.get(key) ?? '').toString().trim().slice(0, max)

/**
 * Which built-in form the job opens.
 *
 * Only a key the code actually offers is stored: the select cannot produce
 * anything else, but this value decides what a page renders, so a stale or
 * hand-posted key becomes «no form» rather than a broken page.
 */
const feature = (form: FormData): string | null => {
  const raw = (form.get('feature') ?? '').toString().trim()
  return raw && isInternalFormKey(raw) ? raw : null
}

function refresh() {
  revalidatePath('/admin/internal')
  revalidatePath('/admin/internal/manage')
  revalidatePath('/admin')
}

/** Add a job. It goes to the end of the list and is visible straight away. */
export async function createJob(_prev: JobsState, form: FormData): Promise<JobsState> {
  const admin = await requireAdmin()
  const t = translator(await getContent())

  const titleAr = text(form, 'titleAr', JOB_TITLE_MAX)
  if (titleAr.length < 2) return { error: t('admin.jobs.nameRequired') }

  const last = await db.internalJob.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  })

  const created = await db.internalJob.create({
    data: {
      titleAr,
      descriptionAr: text(form, 'descriptionAr', JOB_DESCRIPTION_MAX) || null,
      feature: feature(form),
      position: (last?.position ?? 0) + 1,
    },
    select: { id: true },
  })

  await audit({
    actorId: admin.id,
    action: 'internalJob.created',
    entity: 'InternalJob',
    entityId: created.id,
    meta: { titleAr },
  })

  refresh()
  return { ok: t('admin.jobs.added') }
}

/** Rename a job, reword it, or show and hide it. */
export async function updateJob(_prev: JobsState, form: FormData): Promise<JobsState> {
  const admin = await requireAdmin()
  const t = translator(await getContent())

  const id = (form.get('id') ?? '').toString()
  const titleAr = text(form, 'titleAr', JOB_TITLE_MAX)
  if (titleAr.length < 2) return { error: t('admin.jobs.nameRequired') }

  const existing = await db.internalJob.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) return { error: t('message.notFound') }

  await db.internalJob.update({
    where: { id },
    data: {
      titleAr,
      descriptionAr: text(form, 'descriptionAr', JOB_DESCRIPTION_MAX) || null,
      feature: feature(form),
      active: form.get('active') === 'on',
    },
  })

  await audit({
    actorId: admin.id,
    action: 'internalJob.updated',
    entity: 'InternalJob',
    entityId: id,
    meta: { titleAr },
  })

  refresh()
  return { ok: t('message.saved') }
}

/**
 * Move a job up or down.
 *
 * The two rows swap positions rather than the whole list being renumbered, so
 * two people reordering at once cannot leave the list in a state where several
 * jobs claim the same place.
 */
export async function moveJob(_prev: JobsState, form: FormData): Promise<JobsState> {
  const admin = await requireAdmin()
  const t = translator(await getContent())

  const id = (form.get('id') ?? '').toString()
  const direction = form.get('direction') === 'up' ? 'up' : 'down'

  const job = await db.internalJob.findUnique({
    where: { id },
    select: { id: true, position: true },
  })
  if (!job) return { error: t('message.notFound') }

  const neighbour = await db.internalJob.findFirst({
    where:
      direction === 'up'
        ? { position: { lt: job.position } }
        : { position: { gt: job.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
    select: { id: true, position: true },
  })
  if (!neighbour) return {}

  await db.$transaction([
    db.internalJob.update({
      where: { id: job.id },
      data: { position: neighbour.position },
    }),
    db.internalJob.update({
      where: { id: neighbour.id },
      data: { position: job.position },
    }),
  ])

  await audit({
    actorId: admin.id,
    action: 'internalJob.moved',
    entity: 'InternalJob',
    entityId: id,
    meta: { direction },
  })

  refresh()
  return {}
}

/**
 * Remove a job for good.
 *
 * The maintenance screen asks twice before calling this, because nothing else
 * stands between the lawyer and a job that is gone. Hiding is the reversible
 * option, and is what the screen offers first.
 */
export async function deleteJob(_prev: JobsState, form: FormData): Promise<JobsState> {
  const admin = await requireAdmin()
  const t = translator(await getContent())

  const id = (form.get('id') ?? '').toString()
  const job = await db.internalJob.findUnique({
    where: { id },
    select: { id: true, titleAr: true },
  })
  if (!job) return { error: t('message.notFound') }

  await db.internalJob.delete({ where: { id } })

  await audit({
    actorId: admin.id,
    action: 'internalJob.deleted',
    entity: 'InternalJob',
    entityId: id,
    meta: { titleAr: job.titleAr },
  })

  refresh()
  return { ok: t('admin.jobs.deleted') }
}
