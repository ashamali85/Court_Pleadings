/**
 * تفقيط — Arabic number-to-words for Kuwaiti dinars.
 *
 * The petition writes amounts in the oblique case (مجرور/منصوب), because they
 * always follow a preposition or sit inside a parenthetical after "فقط":
 *   470  -> أربعمائة وسبعين دينار كويتي
 *   2820 -> ألفين وثمانمائة وعشرين دينار كويتي
 * The nominative forms (أربعمائة وسبعون، ألفان) are produced with
 * grammaticalCase: 'nominative' for any sentence that needs them.
 *
 * No dependency on the DB or on Next.js — unit-testable in isolation.
 */

export type GrammaticalCase = 'nominative' | 'oblique'

const UNITS = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
]

const UNITS_OBLIQUE = [...UNITS]
UNITS_OBLIQUE[2] = 'اثنين'

const TEENS_PREFIX = [
  '',
  'أحد',
  'اثنا',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
]

const TEENS_PREFIX_OBLIQUE = [...TEENS_PREFIX]
TEENS_PREFIX_OBLIQUE[2] = 'اثني'

const TENS_NOMINATIVE = [
  '',
  'عشرة',
  'عشرون',
  'ثلاثون',
  'أربعون',
  'خمسون',
  'ستون',
  'سبعون',
  'ثمانون',
  'تسعون',
]

const TENS_OBLIQUE = [
  '',
  'عشرة',
  'عشرين',
  'ثلاثين',
  'أربعين',
  'خمسين',
  'ستين',
  'سبعين',
  'ثمانين',
  'تسعين',
]

const HUNDREDS_NOMINATIVE = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
]

const HUNDREDS_OBLIQUE = [...HUNDREDS_NOMINATIVE]
HUNDREDS_OBLIQUE[2] = 'مائتين'

/** 1–999 */
function belowThousand(n: number, gc: GrammaticalCase): string {
  const parts: string[] = []
  const hundreds = Math.floor(n / 100)
  const rest = n % 100

  if (hundreds > 0) {
    parts.push(gc === 'oblique' ? HUNDREDS_OBLIQUE[hundreds] : HUNDREDS_NOMINATIVE[hundreds])
  }

  if (rest > 0) {
    const units = gc === 'oblique' ? UNITS_OBLIQUE : UNITS
    const tensWord = gc === 'oblique' ? TENS_OBLIQUE : TENS_NOMINATIVE
    const teens = gc === 'oblique' ? TEENS_PREFIX_OBLIQUE : TEENS_PREFIX

    if (rest < 10) {
      parts.push(units[rest])
    } else if (rest === 10) {
      parts.push('عشرة')
    } else if (rest < 20) {
      parts.push(`${teens[rest - 10]} عشر`)
    } else {
      const unit = rest % 10
      const ten = Math.floor(rest / 10)
      parts.push(unit > 0 ? `${units[unit]} و${tensWord[ten]}` : tensWord[ten])
    }
  }

  return parts.join(' و')
}

/** 0 – 999,999,999 */
export function numberToArabicWords(value: number, gc: GrammaticalCase = 'oblique'): string {
  const n = Math.floor(Math.abs(value))
  if (n === 0) return 'صفر'

  const parts: string[] = []
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000

  if (millions > 0) {
    if (millions === 1) parts.push('مليون')
    else if (millions === 2) parts.push(gc === 'oblique' ? 'مليونين' : 'مليونان')
    else if (millions <= 10) parts.push(`${belowThousand(millions, 'nominative')} ملايين`)
    else parts.push(`${belowThousand(millions, gc)} مليوناً`)
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف')
    else if (thousands === 2) parts.push(gc === 'oblique' ? 'ألفين' : 'ألفان')
    else if (thousands <= 10) parts.push(`${belowThousand(thousands, 'nominative')} آلاف`)
    else parts.push(`${belowThousand(thousands, gc)} ألفاً`)
  }

  if (rest > 0) parts.push(belowThousand(rest, gc))

  return parts.join(' و')
}

/**
 * Full currency phrase as it appears in the petition, e.g.
 * "ألفين وثمانمائة وعشرين دينار كويتي" or, with fils,
 * "أربعمائة وسبعين دينار كويتي و500 فلس".
 */
export function amountToArabicWords(
  amount: number,
  gc: GrammaticalCase = 'oblique',
): string {
  const rounded = Math.round(Math.abs(amount) * 1000) / 1000
  const dinars = Math.floor(rounded)
  const fils = Math.round((rounded - dinars) * 1000)

  const dinarWords = `${numberToArabicWords(dinars, gc)} دينار كويتي`
  if (fils === 0) return dinarWords

  return `${dinarWords} و${numberToArabicWords(fils, gc)} فلساً`
}

/** 470 -> "470"، 470.5 -> "470.500" (fils are always three digits) */
export function formatAmount(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3)
}
