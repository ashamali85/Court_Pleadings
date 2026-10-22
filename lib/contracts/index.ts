/**
 * The office's own forms — the ones behind الأعمال الداخلية.
 *
 * These are not case types. A `TemplateDef` is something a client fills in and
 * the lawyer reviews; these are filled in by the office and produce a document
 * on the spot, so they carry no status, no inbox row and no attachments. What
 * they do share is the form machinery: sections of `FieldDef`s, which is why
 * their labels and hints appear on /admin/content exactly like a pleading's.
 *
 * A job row on /admin/internal/manage points at one of these by `key`, and its
 * page renders the form. Nothing here imports the generator — `engine.ts`
 * pulls in `docx` and belongs only to the route that returns the file.
 */
import {
  CONTRACT_FORM_KEY,
  contractDefaults,
  contractSections,
} from '@/lib/contracts/criminal-defense/form'
import type { SectionDef } from '@/lib/templates/types'

export type InternalFormDef = {
  /** also the value stored in InternalJob.feature */
  key: string
  nameAr: string
  descriptionAr: string
  sections: SectionDef[]
  defaults: Record<string, unknown>
}

export const criminalDefenseContract: InternalFormDef = {
  key: CONTRACT_FORM_KEY,
  nameAr: 'عقد محاماة (جناية أو جنحة)',
  descriptionAr:
    'إعداد عقد الأتعاب بين المكتب والمتعاقد في قضية جناية أو جنحة، وإصداره بصيغة Word جاهزاً للتوقيع.',
  sections: contractSections,
  defaults: contractDefaults,
}

export const internalForms: InternalFormDef[] = [criminalDefenseContract]

export function getInternalForm(key: string | null | undefined) {
  if (!key) return undefined
  return internalForms.find((form) => form.key === key)
}

/** is this a feature a job may be linked to? */
export function isInternalFormKey(key: string): boolean {
  return internalForms.some((form) => form.key === key)
}
