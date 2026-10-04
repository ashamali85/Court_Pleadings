/**
 * The amount, written the way the office writes it in a financial claim:
 *
 *   7,250.000 د.ك. (سبعة آلاف ومائتان وخمسون دينارًا كويتيًا)
 *   4,341.710 د.ك. (أربعة آلاف وثلاثمائة وواحد وأربعون ديناراً كويتياً و710 فلسًا)
 *
 * Three things differ from the eviction petition, which is why this does not
 * reuse `formatAmount` from lib/tafqeet:
 *
 *   1. figures carry a thousands separator and always three decimals;
 *   2. the words are nominative (ومائتان وخمسون), not oblique;
 *   3. the fils are written in figures, never spelled out.
 *
 * Source: docs/business-rules/template-notes.md «صيغة المبلغ» and
 * amr-notes.md §5, with the two examples above taken from the office's own
 * approved output.
 */
import { numberToArabicWords } from '@/lib/tafqeet'

/** 7250 -> "7,250.000" — fils are always three digits, thousands are grouped */
export function formatMoney(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 1000) / 1000
  const dinars = Math.floor(rounded)
  const fils = Math.round((rounded - dinars) * 1000)
  const grouped = dinars.toLocaleString('en-US')
  return `${grouped}.${String(fils).padStart(3, '0')}`
}

/**
 * The counted noun after the number. Arabic chooses it by the last two digits:
 * 3–10 take the plural (خمسة دنانير), 11–99 the accusative singular
 * (واحد وأربعون ديناراً), and a round hundred or thousand the bare singular
 * (خمسمائة دينار). One and two are left bare, which reads correctly in the
 * places this phrase appears.
 */
function dinarNoun(dinars: number): string {
  const lastTwo = dinars % 100
  if (lastTwo >= 3 && lastTwo <= 10) return 'دنانير كويتية'
  if (lastTwo >= 11 && lastTwo <= 99) return 'دينارًا كويتيًا'
  return 'دينار كويتي'
}

/** the parenthetical: «سبعة آلاف ومائتان وخمسون دينارًا كويتيًا» */
export function amountInWords(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 1000) / 1000
  const dinars = Math.floor(rounded)
  const fils = Math.round((rounded - dinars) * 1000)

  const words = `${numberToArabicWords(dinars, 'nominative')} ${dinarNoun(dinars)}`
  // the office writes the fils in figures — «و710 فلسًا» — in every approved
  // document, so they are not spelled out here
  return fils === 0 ? words : `${words} و${fils} فلسًا`
}

/** the whole phrase: «7,250.000 د.ك. (سبعة آلاف ومائتان وخمسون دينارًا كويتيًا)» */
export function moneyPhrase(amount: number): string {
  return `${formatMoney(amount)} د.ك. (${amountInWords(amount)})`
}
