/**
 * Forgiving Arabic matching for the type-to-search fields.
 *
 * A client typing their own nationality should never fail over a spelling
 * detail they cannot see: the damma in «عُماني», the hamza in «أردني», whether
 * they finished «سوريه» with a ta marbuta or a plain ha. So both the query and
 * the label are flattened to a comparable skeleton before they ever meet.
 *
 * The skeleton is for comparison only. What is displayed and what is stored is
 * always the original text.
 */

/*
 * Written as escapes and built with `new RegExp` on purpose. A combining
 * damma pasted straight into a character class is invisible in an editor and
 * in a diff, so the next person to touch this file cannot see what they are
 * deleting. Double backslashes keep the escapes escapes, whatever the
 * formatter does to the file.
 */

// fathatan..sukun, plus the superscript alef
const DIACRITICS = new RegExp('[\\u064B-\\u0652\\u0670]', 'g')
const TATWEEL = new RegExp('\\u0640', 'g')

const ALEF = 'ا'
const YEH = 'ي'
const HEH = 'ه'
const WAW = 'و'

/** أ إ آ ٱ -> ا, ى -> ي, ة -> ه, ؤ -> و, ئ -> ي */
const LETTER_FOLD: Record<string, string> = {
  أ: ALEF, // أ  alef with hamza above
  إ: ALEF, // إ  alef with hamza below
  آ: ALEF, // آ  alef with madda
  ٱ: ALEF, // ٱ  alef wasla
  ى: YEH, // ى  alef maqsura
  ة: HEH, // ة  ta marbuta
  ؤ: WAW, // ؤ  waw with hamza
  ئ: YEH, // ئ  yeh with hamza
}

/** the definite article, «ال» */
const AL = 'ال'

const ARABIC_INDIC_ZERO = 0x0660
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0

function foldDigit(code: number): string | null {
  if (code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9) {
    return String(code - ARABIC_INDIC_ZERO)
  }
  if (code >= EXTENDED_ARABIC_INDIC_ZERO && code <= EXTENDED_ARABIC_INDIC_ZERO + 9) {
    return String(code - EXTENDED_ARABIC_INDIC_ZERO)
  }
  return null
}

/** The comparison skeleton: no diacritics, no tatweel, folded letters, one space. */
export function normaliseArabic(input: string): string {
  const stripped = input.normalize('NFKC').replace(DIACRITICS, '').replace(TATWEEL, '')

  let out = ''
  for (const char of stripped) {
    const digit = foldDigit(char.codePointAt(0) ?? 0)
    out += digit ?? LETTER_FOLD[char] ?? char
  }

  return out.toLowerCase().replace(/\s+/g, ' ').trim()
}

export type Ranked<T> = { item: T; rank: number }

/** «الكويت» and «الهند» are how people name a country; the list holds adjectives */
function withoutAl(q: string): string | null {
  return q.startsWith(AL) && q.length > 4 ? q.slice(AL.length) : null
}

function commonPrefix(a: string, b: string): number {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[i] === b[i]) i += 1
  return i
}

/**
 * «امريكا» vs «امريكي», «فرنسا» vs «فرنسي» — the country and the adjective
 * differ only in the last letter, so neither is a prefix of the other. Accept
 * a long shared head instead: at least three characters, and at least 70% of
 * the shorter of the two, which keeps «تشيلي» from matching «تشيكي».
 */
function sharesStem(a: string, b: string): boolean {
  const shared = commonPrefix(a, b)
  if (shared < 3) return false
  return shared >= Math.ceil(Math.min(a.length, b.length) * 0.7)
}

/**
 * Lower is better. Anything that returns null is dropped. Ordering inside a
 * rank is the caller's original order, which for nationalities means Kuwait
 * and the GCC stay on top.
 *
 * The middle ranks exist because a client types the country, not the
 * adjective: «الكويت» for كويتي, «سوريا» for سوري, «ألمانيا» for ألماني. One
 * is the definite article, the other is the adjective with a longer ending, so
 * both directions of prefix have to be tried.
 */
export function rankOption(query: string, label: string, code?: string): number | null {
  const q = normaliseArabic(query)
  if (!q) return 0

  const hay = normaliseArabic(label)
  if (hay.startsWith(q)) return 0
  if (hay.includes(q)) return 1

  const bare = withoutAl(q)
  if (bare && hay.startsWith(bare)) return 2
  if (bare && hay.includes(bare)) return 3

  // «سوريا» / «ألمانيا» / «السعودية» — the label is the stem of what was typed
  if (hay.length >= 3 && (q.startsWith(hay) || bare?.startsWith(hay))) return 4

  // «امريكا» / «فرنسا» — same stem, different ending
  if (sharesStem(hay, q) || (bare && sharesStem(hay, bare))) return 5

  // typing the ISO code costs no extra data and beats showing an empty list
  if (code && code.toLowerCase().startsWith(q)) return 6

  return null
}

/**
 * Filter + rank. An empty query returns the list untouched, so the curated
 * order — Kuwait, then the GCC, then the Arab states — survives.
 *
 * Ties break on the shorter label, because the shorter one is the closer
 * match: «الهند» reaches both هندي and هندوراسي, and هندي is what was meant.
 */
export function searchOptions<T extends { value: string; labelAr: string }>(
  options: readonly T[],
  query: string,
): T[] {
  if (!query.trim()) return [...options]

  const ranked: (Ranked<T> & { i: number; len: number })[] = []
  options.forEach((item, i) => {
    const rank = rankOption(query, item.labelAr, item.value)
    if (rank !== null) {
      ranked.push({ item, rank, i, len: normaliseArabic(item.labelAr).length })
    }
  })

  return ranked
    .sort((a, b) => a.rank - b.rank || a.len - b.len || a.i - b.i)
    .map((r) => r.item)
}
