import { toLatinDigits } from '@/lib/numerals'
import { evictionTemplate } from '@/lib/templates/eviction'
import type { FieldDef, TemplateDef } from '@/lib/templates/types'

// Adding a second case type is: write the .docx template, write its TemplateDef,
// register it here, and seed it. No other file changes.
export const templates: TemplateDef<never>[] = [
  evictionTemplate as unknown as TemplateDef<never>,
]

export function getTemplate(key: string): TemplateDef<never> | undefined {
  return templates.find((t) => t.key === key)
}

export function allFields(template: TemplateDef<never>): FieldDef[] {
  return template.sections.flatMap((s) => s.fields)
}

/** FormData -> raw values object; zod does the coercion and validation. */
export function formDataToValues(
  template: TemplateDef<never>,
  formData: FormData,
): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of allFields(template)) {
    if (field.type === 'boolean') {
      const raw = formData.get(field.name)
      values[field.name] = raw === 'on' || raw === 'true'
    } else {
      const raw = (formData.get(field.name) ?? '').toString().trim()
      // an Arabic keyboard types ٤٥٠ and ١٩/٥/٢٠٢٦; store Latin digits
      values[field.name] =
        field.type === 'number' || field.type === 'date' ? toLatinDigits(raw) : raw
    }
  }
  return values
}

/** Overrides the lawyer typed on the review screen (blank = keep computed). */
export function formDataToOverrides(
  template: TemplateDef<never>,
  formData: FormData,
): Record<string, string> {
  const overrides: Record<string, string> = {}
  for (const item of template.overridable) {
    const raw = (formData.get(`override__${item.name}`) ?? '').toString().trim()
    if (raw) overrides[item.name] = raw
  }
  return overrides
}
