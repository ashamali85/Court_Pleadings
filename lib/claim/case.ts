/**
 * A financial claim, as the client and the office answer it.
 *
 * The two parties are not described here: they are the shared party model in
 * lib/templates/party.ts, the same one every pleading type uses. What belongs
 * to this case type is the debt, its instrument, and the handful of office
 * facts the lawyer fills at review — the court, the date the payment demand
 * was posted, and the number and refusal date of the payment order, since
 * nobody can know a payment order's number before it has been filed.
 */
import type { Instrument } from '@/lib/claim/instruments'
import type { PartyValues } from '@/lib/templates/party'

/** طبيعة العلاقة — the first three are offered, the fourth is written in. */
export const RELATIONSHIPS = [
  { value: 'commercial', labelAr: 'علاقة تجارية' },
  { value: 'loan', labelAr: 'قرض حسن' },
  { value: 'contract', labelAr: 'علاقة تعاقدية' },
  { value: 'other', labelAr: 'أخرى' },
] as const

export type ClaimCase = {
  claimant: PartyValues
  respondent: PartyValues
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

export function relationshipText(claim: ClaimCase): string {
  if (claim.relationship === 'other') return claim.relationshipOther.trim()
  return (
    RELATIONSHIPS.find((r) => r.value === claim.relationship)?.labelAr ??
    claim.relationship
  )
}
