/**
 * Which fields a set of values actually puts on the screen.
 *
 * This lives apart from the form component because it decides more than
 * layout: a field that is not rendered has no input, so it posts nothing and
 * its stored value is lost on the next submit. That makes it worth testing
 * without a browser, which a 'use client' module cannot be.
 */
import type { FieldDef, SectionDef } from '@/lib/templates/types'

/** The string a control would hold for this value — the form's own view of it. */
export function fieldString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : ''
  return String(value)
}

/**
 * The label this field shows right now. A field can carry alternative wordings
 * that depend on another answer, so the same input can read «عنوان المدعى
 * عليه» or «عنوان الجهة الحكومية» without becoming two fields with two values.
 */
export function fieldLabel(field: FieldDef, values: Record<string, unknown>): string {
  for (const alt of field.labelWhen ?? []) {
    if (alt.equals.includes(fieldString(values[alt.field]))) return alt.labelAr
  }
  return field.labelAr
}

/**
 * A field with `showWhen` exists only while another field holds one of the
 * listed values. Hidden means unmounted, so it submits nothing at all and the
 * schema decides what an absent value means.
 */
export function isFieldVisible(
  field: FieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.showWhen) return true
  return field.showWhen.equals.includes(fieldString(values[field.showWhen.field]))
}

/** a section as the form will actually draw it */
export type RenderedSection = SectionDef & {
  /** this is the last of its series and another may be added */
  canAdd: boolean
  /** this one may be removed */
  canRemove: boolean
}

/** how many parties a side currently has */
export function seriesCount(countField: string, values: Record<string, unknown>) {
  const raw = Number(fieldString(values[countField]))
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1
}

/**
 * The sections a form draws, in order.
 *
 * Three things are decided here rather than in each form, so the client's form
 * and the lawyer's review screen cannot disagree about them: office-only
 * fields are dropped for the client, a section left with nothing in it is
 * dropped rather than shown empty, and a repeatable section appears only while
 * its series is that long.
 */
export function visibleSections(
  sections: SectionDef[],
  values: Record<string, unknown>,
  options: { includeAdminOnly?: boolean } = {},
): RenderedSection[] {
  const out: RenderedSection[] = []

  for (const section of sections) {
    const fields = options.includeAdminOnly
      ? section.fields
      : section.fields.filter((field) => !field.adminOnly)
    if (fields.length === 0) continue

    const repeat = section.repeat
    if (!repeat) {
      out.push({ ...section, fields, canAdd: false, canRemove: false })
      continue
    }

    const count = seriesCount(repeat.countField, values)
    if (repeat.index > count) continue

    out.push({
      ...section,
      fields,
      canAdd: repeat.index === count && count < repeat.max,
      canRemove: repeat.index > 1,
    })
  }

  return out
}

/** every repeatable series in a template, by the field that counts it */
export function seriesCountFields(sections: SectionDef[]): string[] {
  const fields = new Set<string>()
  for (const section of sections) {
    if (section.repeat) fields.add(section.repeat.countField)
  }
  return [...fields]
}
