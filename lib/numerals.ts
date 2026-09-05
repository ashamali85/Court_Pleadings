/**
 * Arabic keyboards produce Arabic-Indic digits (٠١٢٣) and Persian keyboards
 * Eastern ones (۰۱۲۳). Number() and Date parsing reject both, so every numeric
 * or date value is normalised to Latin digits before validation.
 */
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹'

export function toLatinDigits(input: string): string {
  let out = ''
  for (const char of input) {
    const arabic = ARABIC_INDIC.indexOf(char)
    if (arabic !== -1) {
      out += String(arabic)
      continue
    }
    const eastern = EASTERN_ARABIC.indexOf(char)
    if (eastern !== -1) {
      out += String(eastern)
      continue
    }
    // Arabic decimal separator and thousands mark
    if (char === '٫') out += '.'
    else if (char === '٬') continue
    else out += char
  }
  return out
}

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
]

/** "19/5/2019" -> { day: 19, month: 5, year: 2019 } */
export function parseDate(
  value: string,
): { day: number; month: number; year: number } | null {
  const match = toLatinDigits(value.trim()).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return { day, month, year }
}

/** Arabic weekday for a d/m/yyyy string — "19/5/2019" -> "الأحد". */
export function weekdayAr(value: string): string {
  const parsed = parseDate(value)
  if (!parsed) return ''
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  return WEEKDAYS_AR[date.getUTCDay()] ?? ''
}
