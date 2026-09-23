import type { ZodType } from 'zod'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  /** a repeatable group of fields — one heir, one partner, one row */
  | 'rows'

/**
 * How wide the control should be, named after the kind of value it holds
 * rather than a number of pixels. Resolves to a `--field-w-*` token.
 * Omitted means the control fills its grid cell — right for free prose.
 */
export type FieldWidth =
  | 'short'
  | 'reg'
  | 'money'
  | 'num'
  | 'date'
  | 'sel'
  | 'phrase'
  | 'name'
  | 'org'
  | 'full'

export type FieldDef = {
  name: string
  labelAr: string
  hintAr?: string
  type: FieldType
  required?: boolean
  options?: { value: string; labelAr: string }[]
  /** a select with too many options to scroll: type to filter instead */
  searchable?: boolean
  /** draw a small picture beside each option — 'flag' keys off the ISO code */
  optionIcon?: 'flag'
  /** control width; see FieldWidth */
  width?: FieldWidth
  /** columns out of 12 the field occupies, so two short fields can share a
      line. Default 12 — one field per line. Collapses to 12 under 640px. */
  span?: number
  /** for a "same as …" checkbox: which field this one mirrors when ticked */
  mirrorOf?: string
  /** show this field only when the named boolean field is false */
  hiddenWhen?: string
  /** show this field only while another field holds one of these values */
  showWhen?: { field: string; equals: string[] }
  /** store Latin digits even when the client types ٤٥٠ */
  latinDigits?: boolean
  placeholder?: string
  rows?: number

  /* --- type: 'rows' ------------------------------------------------- */
  /** the fields that repeat in every row */
  rowFields?: FieldDef[]
  /** «إضافة وريث» */
  addLabelAr?: string
  /** «وريث» — numbered per row in the UI */
  rowLabelAr?: string
  /** rows the client cannot go below (default 1) */
  minRows?: number
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
