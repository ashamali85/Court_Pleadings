'use server'

import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { contentDefaults, getContent, translator } from '@/lib/content'
import db from '@/lib/db'

export type ContentState = { ok?: string; error?: string }

/**
 * Saves the whole catalogue in one submit. A value equal to the built-in
 * default (or left blank) deletes its row, so the original wording comes back.
 */
export async function saveContent(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const admin = await requireAdmin()
  const t = translator(await getContent())
  const defaults = contentDefaults()

  const toUpsert: { key: string; value: string }[] = []
  const toDelete: string[] = []

  for (const key of Object.keys(defaults)) {
    const raw = formData.get(`text__${key}`)
    if (raw === null) continue

    const value = raw.toString().trim()
    if (!value || value === defaults[key].trim()) toDelete.push(key)
    else toUpsert.push({ key, value })
  }

  await db.$transaction([
    ...toDelete.map((key) => db.siteText.deleteMany({ where: { key } })),
    ...toUpsert.map((row) =>
      db.siteText.upsert({
        where: { key: row.key },
        create: { key: row.key, value: row.value, updatedById: admin.id },
        update: { value: row.value, updatedById: admin.id },
      }),
    ),
  ])

  await audit({
    actorId: admin.id,
    action: 'content.updated',
    entity: 'SiteText',
    entityId: 'catalogue',
    meta: { changed: toUpsert.length, restored: toDelete.length },
  })

  // wording appears on every page, so drop the whole cached tree
  revalidatePath('/', 'layout')

  return { ok: t('admin.content.savedMsg') }
}
