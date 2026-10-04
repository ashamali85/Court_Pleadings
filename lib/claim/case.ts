/**
 * A financial claim, as the client and the office answer it.
 *
 * The shape follows the lawyer's own question list (template-notes.md §«قائمة
 * الأسئلة») rather than the shape of any one document, because the same
 * answers feed all four. Four of the answers are office facts — the court, the
 * date the payment demand was posted, and the number and refusal date of the
 * payment order — and are filled by the lawyer at review, not by the client:
 * nobody can know a payment order's number before it has been filed.
 */
import type { PartyForm } from '@/lib/claim/grammar'
import type { Instrument } from '@/lib/claim/instruments'

/** The four شخص/شركة answers, which also settle the grammar. */
export const PARTY_KINDS = ['man', 'woman', 'company', 'several'] as const
export type PartyKind = (typeof PARTY_KINDS)[number]

export const PARTY_KIND_LABEL: Record<PartyKind, string> = {
  man: 'شخص طبيعي — رجل',
  woman: 'شخص طبيعي — امرأة',
  company: 'شركة',
  several: 'أكثر من طرف',
}

/** A company is written as feminine; several parties as plural. */
export function formOf(kind: PartyKind): PartyForm {
  if (kind === 'woman' || kind === 'company') return 'f'
  if (kind === 'several') return 'pl'
  return 'm'
}

export type ClaimParty = {
  kind: PartyKind
  /** the name as it is written in the pleading */
  name: string
  /** شخص طبيعي: ISO code, or STATELESS */
  nationality: string
  /** شخص طبيعي: twelve digits */
  civilId: string
  /** شركة: الرقم المدني للجهة */
  entityCivilNo: string
  /** شركة: رقم السجل التجاري */
  commercialRegister: string
  /** شركة المعلن إليها: الممثل القانوني */
  representative: string
}

export function blankParty(kind: PartyKind = 'man'): ClaimParty {
  return {
    kind,
    name: '',
    nationality: 'KW',
    civilId: '',
    entityCivilNo: '',
    commercialRegister: '',
    representative: '',
  }
}

/** طبيعة العلاقة — the first three are offered, the fourth is written in. */
export const RELATIONSHIPS = [
  { value: 'commercial', labelAr: 'علاقة تجارية' },
  { value: 'loan', labelAr: 'قرض حسن' },
  { value: 'contract', labelAr: 'علاقة تعاقدية' },
  { value: 'other', labelAr: 'أخرى' },
] as const

export type ClaimCase = {
  claimant: ClaimParty
  respondent: ClaimParty
  /** عنوان إعلان المعلن إليه — never the automated address number */
  respondentAddress: string
  /** مبلغ المطالبة بالدينار */
  amount: number
  /** one of RELATIONSHIPS, or free text when «أخرى» */
  relationship: string
  relationshipOther: string
  instruments: Instrument[]
  /** الفوائد القانونية 7% */
  legalInterest: boolean
  /** هل يوجد عقد مبرم بين الطرفين؟ — a row in the exhibit list */
  hasContract: boolean

  /* --- the office's own answers, filled at review ------------------- */
  /** اسم المحكمة، مثل «الرقعي» */
  courtName: string
  /** تاريخ إرسال التكليف بالوفاء بالبريد المسجل */
  demandPostedOn: string
  /** رقم أمر الأداء المرفوض وسنته */
  orderNumber: string
  orderYear: string
  /** تاريخ رفض أمر الأداء */
  orderRefusedOn: string
  /** عنوان الطالب نفسه — أمر الأداء only, since the صحيفة uses the office */
  claimantAddress: string
  /** العنوان الإلكتروني في تطبيق هويتي — أمر الأداء only */
  claimantEmail: string
}

export function blankCase(): ClaimCase {
  return {
    claimant: blankParty('company'),
    respondent: blankParty('man'),
    respondentAddress: '',
    amount: 0,
    relationship: 'commercial',
    relationshipOther: '',
    instruments: [],
    legalInterest: true,
    hasContract: false,
    courtName: '',
    demandPostedOn: '',
    orderNumber: '',
    orderYear: '',
    orderRefusedOn: '',
    claimantAddress: '',
    claimantEmail: '',
  }
}

export function relationshipText(claim: ClaimCase): string {
  if (claim.relationship === 'other') return claim.relationshipOther.trim()
  return (
    RELATIONSHIPS.find((r) => r.value === claim.relationship)?.labelAr ??
    claim.relationship
  )
}
