/**
 * Which court, and which of the four documents the office delivers.
 *
 * Both are decided from the case rather than asked. The court level follows
 * the amount — 5,001 د.ك. and above is الكلية, below it الجزئية — and the
 * documents follow the instrument: a commercial paper has to go through a
 * payment order, so the claim produces four documents instead of two.
 *
 * Source: docs/business-rules/amr-notes.md §2 and template-notes.md
 * «عدد المخرجات حسب نوع سند الدين».
 */
import type { ClaimDocument } from '@/lib/claim/grammar'
import { hasCommercialPaper, type Instrument } from '@/lib/claim/instruments'

/** at and above this, the claim belongs to the full court */
export const FULL_COURT_THRESHOLD = 5001

export type CourtLevel = {
  /** «الكلية» / «الجزئية» — follows محكمة */
  courtAr: string
  /** «كلي» / «جزئي» — follows أمر أداء */
  orderAr: string
  full: boolean
}

export function courtLevel(amount: number): CourtLevel {
  const full = amount >= FULL_COURT_THRESHOLD
  return {
    courtAr: full ? 'الكلية' : 'الجزئية',
    orderAr: full ? 'كلي' : 'جزئي',
    full,
  }
}

/** «محكمة الرقعي الجزئية» — blank court name still reads correctly */
export function courtName(name: string, amount: number): string {
  const level = courtLevel(amount)
  const trimmed = name.trim()
  return trimmed ? `محكمة ${trimmed} ${level.courtAr}` : `المحكمة ${level.courtAr}`
}

/**
 * The documents this claim produces. The payment demand and the payment order
 * exist only to satisfy articles 166/167, which only a commercial paper has to
 * go through; every claim gets the lawsuit and the exhibit list.
 */
export function documentsFor(instruments: Instrument[]): ClaimDocument[] {
  return hasCommercialPaper(instruments)
    ? ['lawsuit', 'demand', 'order', 'exhibits']
    : ['lawsuit', 'exhibits']
}
