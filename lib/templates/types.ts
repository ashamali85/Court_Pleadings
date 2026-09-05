import type { ZodType } from 'zod'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean'

export type FieldDef = {
  name: string
  labelAr: string
  hintAr?: string
  type: FieldType
  required?: boolean
  options?: { value: string; labelAr: string }[]
  /** for a "same as …" checkbox: which field this one mirrors when ticked */
  mirrorOf?: string
  /** show this field only when the named boolean field is false */
  hiddenWhen?: string
  placeholder?: string
  rows?: number
}

export type SectionDef = {
  key: string
  titleAr: string
  fields: FieldDef[]
}

/** Values that go into the .docx, keyed by the placeholder name in the template. */
export type Placeholders = Record<string, string | boolean>

export type TemplateDef<TValues> = {
  key: string
  nameAr: string
  descriptionAr: string
  filenamePrefix: string
  sections: SectionDef[]
  schema: ZodType<TValues>
  /** placeholder values, with any lawyer overrides applied last */
  derive: (values: TValues, overrides?: Record<string, string>) => Placeholders
  /** placeholders the lawyer may hand-edit on the review screen */
  overridable: { name: string; labelAr: string }[]
  /** short line shown in the admin inbox */
  summary: (values: TValues) => string
}
