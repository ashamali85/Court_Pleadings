import 'server-only'
import { cache } from 'react'
import db from '@/lib/db'
import { contentDefaults, type ContentMap } from '@/lib/content/defaults'
import type { FieldDef, SectionDef, TemplateDef } from '@/lib/templates/types'

export { CONTENT_GROUPS, contentDefaults } from '@/lib/content/defaults'
export type { ContentMap } from '@/lib/content/defaults'

/**
 * Defaults overlaid with the admin's edits. Cached per request, so a page that
 * needs twenty strings still makes one query.
 */
export const getContent = cache(async (): Promise<ContentMap> => {
  const map = contentDefaults()
  try {
    const rows = await db.siteText.findMany()
    for (const row of rows) {
      if (typeof row.value === 'string' && row.value.trim()) map[row.key] = row.value
    }
  } catch (error) {
    // never let a content problem take a page down — fall back to defaults
    console.error('[content] falling back to defaults', error)
  }
  return map
})

/** `t('client.list.title')`, with {placeholders} filled from `vars`. */
export function translator(content: ContentMap) {
  return (key: string, vars?: Record<string, string | number>): string => {
    let value = content[key] ?? key
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement))
      }
    }
    return value
  }
}

/** A field with the admin's wording applied, row fields included. */
function applyToField(field: FieldDef, base: string, content: ContentMap): FieldDef {
  return {
    ...field,
    labelAr: content[`${base}.label`] ?? field.labelAr,
    hintAr: content[`${base}.hint`] ?? field.hintAr,
    placeholder: content[`${base}.placeholder`] ?? field.placeholder,
    rowFields: field.rowFields?.map((sub) =>
      applyToField(sub, `${base}.${sub.name}`, content),
    ),
  }
}

/** Template sections with the admin's label/hint/placeholder wording applied. */
export function applyContentToSections(
  template: TemplateDef<never>,
  content: ContentMap,
): SectionDef[] {
  return template.sections.map((section) => ({
    ...section,
    titleAr: content[`section.${template.key}.${section.key}.title`] ?? section.titleAr,
    fields: section.fields.map((field) =>
      applyToField(field, `field.${template.key}.${field.name}`, content),
    ),
  }))
}

export function applyContentToOverridable(
  template: TemplateDef<never>,
  content: ContentMap,
): { name: string; labelAr: string }[] {
  return template.overridable.map((item) => ({
    name: item.name,
    labelAr: content[`override.${template.key}.${item.name}.label`] ?? item.labelAr,
  }))
}

export function templateName(template: TemplateDef<never>, content: ContentMap) {
  return content[`template.${template.key}.name`] ?? template.nameAr
}

export function templateDescription(template: TemplateDef<never>, content: ContentMap) {
  return content[`template.${template.key}.description`] ?? template.descriptionAr
}
