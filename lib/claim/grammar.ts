/**
 * Arabic agreement for a مطالبة مالية (financial claim).
 *
 * The office's four documents name the same two people differently, and the
 * lawyer's rules are explicit that the pairs must never be mixed:
 *
 *   صحيفة الدعوى      الطالب        ↔ المعلن إليه
 *   تكليف بالوفاء      الدائن        ↔ (addressed in the second person)
 *   أمر الأداء         الدائن/المدين  and  مقدم الطلب/المقدم ضده
 *   حافظة المستندات    المدعي        ↔ المدعى عليه
 *
 * So the vocabulary is reached through `vocabulary(document)`, which hands out
 * only that document's pair. A caller cannot write «المدعى عليه» into the
 * صحيفة by accident, because the صحيفة's vocabulary has no such word.
 *
 * Every noun also bends for the party's grammatical form — masculine, feminine
 * or plural — and a company counts as feminine (الشركة … تُعامل معاملة المؤنث).
 *
 * Source: docs/business-rules/{template,takleef,amr,hafeza}-notes.md, written
 * by the office and approved 2026-10-02.
 */
import { nationalityLabel, STATELESS } from '@/lib/nationalities'

/** The grammatical form a party takes in the text. A company is feminine. */
export const PARTY_FORMS = ['m', 'f', 'pl'] as const
export type PartyForm = (typeof PARTY_FORMS)[number]

/** The four documents one claim produces. */
export const CLAIM_DOCUMENTS = ['lawsuit', 'demand', 'order', 'exhibits'] as const
export type ClaimDocument = (typeof CLAIM_DOCUMENTS)[number]

export const CLAIM_DOCUMENT_LABEL: Record<ClaimDocument, string> = {
  lawsuit: 'صحيفة دعوى',
  demand: 'تكليف بالوفاء',
  order: 'طلب استصدار أمر أداء',
  exhibits: 'حافظة مستندات',
}

/**
 * Arabic marks case on the plural, so «الطالبون» and «الطالبين» are the same
 * word in two positions: subject, or after a preposition. Singular forms do
 * not change, which is why only the plural column has two entries.
 */
export type Position = 'subject' | 'oblique'

type Declension = { m: string; f: string; pl: string; plOblique?: string }

function decline(word: Declension, form: PartyForm, position: Position): string {
  if (form !== 'pl') return word[form]
  return position === 'oblique' ? (word.plOblique ?? word.pl) : word.pl
}

/* --- the four pairs, written once ----------------------------------- */

const TALIB: Declension = {
  m: 'الطالب',
  f: 'الطالبة',
  pl: 'الطالبون',
  plOblique: 'الطالبين',
}

const MOALAN_ILAYH: Declension = {
  m: 'المعلن إليه',
  f: 'المعلن إليها',
  pl: 'المعلن إليهم',
}

const DAEN: Declension = {
  m: 'الدائن',
  f: 'الدائنة',
  pl: 'الدائنون',
  plOblique: 'الدائنين',
}

const MADEEN: Declension = {
  m: 'المدين',
  f: 'المدينة',
  pl: 'المدينون',
  plOblique: 'المدينين',
}

const MOQADDIM: Declension = {
  m: 'مقدم الطلب',
  f: 'مقدمة الطلب',
  pl: 'مقدمو الطلب',
  plOblique: 'مقدمي الطلب',
}

const MOQADDAM_DIDDAH: Declension = {
  m: 'المقدم ضده',
  f: 'المقدم ضدها',
  pl: 'المقدم ضدهم',
}

const MUDDAI: Declension = {
  m: 'المدعي',
  f: 'المدعية',
  pl: 'المدعون',
  plOblique: 'المدعين',
}

const MUDDA_ALAYH: Declension = {
  m: 'المدعى عليه',
  f: 'المدعى عليها',
  pl: 'المدعى عليهم',
}

const PAIRS: Record<ClaimDocument, { claimant: Declension; respondent: Declension }> = {
  lawsuit: { claimant: TALIB, respondent: MOALAN_ILAYH },
  demand: { claimant: DAEN, respondent: MADEEN },
  order: { claimant: MOQADDIM, respondent: MOQADDAM_DIDDAH },
  exhibits: { claimant: MUDDAI, respondent: MUDDA_ALAYH },
}

/**
 * أمر الأداء uses two pairs: «(الدائن)» و«(المدين)» label the parties in the
 * heading, while the body, the prayer and the order itself say «مقدم الطلب»
 * و«المقدم ضده». Both belong to that one document, so both live here.
 */
const ORDER_HEADING = { claimant: DAEN, respondent: MADEEN }

/**
 * The words one document is allowed to use. Reaching for a role through this
 * is what keeps the pairs from mixing.
 */
export function vocabulary(document: ClaimDocument) {
  const pair = PAIRS[document]
  return {
    document,
    claimant: (form: PartyForm, position: Position = 'subject') =>
      decline(pair.claimant, form, position),
    respondent: (form: PartyForm, position: Position = 'subject') =>
      decline(pair.respondent, form, position),
    /** أمر الأداء only: «(الدائن)» / «(المدين)» as they appear in the heading */
    headingClaimant: (form: PartyForm) =>
      document === 'order' ? decline(ORDER_HEADING.claimant, form, 'subject') : '',
    headingRespondent: (form: PartyForm) =>
      document === 'order' ? decline(ORDER_HEADING.respondent, form, 'subject') : '',
  }
}

/* --- the smaller agreements ----------------------------------------- */

/** «السيد/» «السيدة/» «السادة/» */
export function honorific(form: PartyForm): string {
  return form === 'f' ? 'السيدة' : form === 'pl' ? 'السادة' : 'السيد'
}

/** closes an address line: «المحترم» */
export function respectful(form: PartyForm): string {
  return form === 'f' ? 'المحترمة' : form === 'pl' ? 'المحترمين' : 'المحترم'
}

/**
 * Arabic puts the verb before its subject, and a verb in that position stays
 * singular — «يرتبط الطالبون»، not «يرتبطون». So only gender moves the prefix,
 * and a masculine plural takes the masculine form.
 */
export function verb(stem: { m: string; f: string }, form: PartyForm): string {
  return form === 'f' ? stem.f : stem.m
}

export const VERBS = {
  /** يرتبط الطالب … بعلاقة تجارية */
  relates: { m: 'يرتبط', f: 'ترتبط' },
  /** يداين الطالب المعلن إليه بمبلغ */
  isOwed: { m: 'يداين', f: 'تداين' },
  /** قام الطالب … بتقديم طلب */
  did: { m: 'قام', f: 'قامت' },
  /** أحال الدائن المطالبة لنا */
  referred: { m: 'أحال', f: 'أحالت' },
  /** يكون الطالب قد انتهج الطريق */
  became: { m: 'يكون', f: 'تكون' },
  /** ولما كان المعلن إليه قد امتنع — كان agrees with the subject that follows */
  was: { m: 'كان', f: 'كانت' },
  /** انتهج الطالب الطريق الذي رسمه القانون */
  followed: { m: 'انتهج', f: 'انتهجت' },
  /** يلتمس الطالب إصدار أمركم */
  prays: { m: 'يلتمس', f: 'تلتمس' },
} as const

/**
 * A verb that follows its subject agrees in number as well: «المعلن إليهم قد
 * امتنعوا». The leading verb in the same sentence stays singular — that is
 * `verb()` above — so the two are deliberately different functions.
 */
export function trailingVerb(
  stem: { m: string; f: string; pl: string },
  form: PartyForm,
): string {
  return stem[form]
}

export const TRAILING_VERBS = {
  /** قد امتنع عن الوفاء */
  abstained: { m: 'امتنع', f: 'امتنعت', pl: 'امتنعوا' },
  /** قد انتهج الطريق الذي رسمه القانون */
  followed: { m: 'انتهج', f: 'انتهجت', pl: 'انتهجوا' },
  /** قد أحال لنا المطالبة */
  referred: { m: 'أحال', f: 'أحالت', pl: 'أحالوا' },
  /** قد قام بتقديم الطلب */
  did: { m: 'قام', f: 'قامت', pl: 'قاموا' },
} as const

/**
 * Arabic writes a preposition onto the following word, and لـ swallows the
 * article: لـ + الطالبة = للطالبة. Writing «ل الطالبة» would be wrong, and
 * writing «لالطالبة» worse.
 */
export function withLam(word: string): string {
  return word.startsWith('ال') ? `لل${word.slice(2)}` : `ل${word}`
}

/** بـ + المعلن إليه = بالمعلن إليه */
export function withBa(word: string): string {
  return `ب${word}`
}

/** «وموطنه المختار» / «وموطنها المختار» — the chosen domicile of the claimant */
export function domicile(form: PartyForm): string {
  const pronoun = form === 'f' ? 'ها' : form === 'pl' ? 'هم' : 'ه'
  return `وموطن${pronoun} المختار`
}

/** the object pronoun for the respondent: إلزامـه / إلزامـها / إلزامـهم */
export function objectSuffix(form: PartyForm): string {
  return form === 'f' ? 'ها' : form === 'pl' ? 'هم' : 'ه'
}

/** «بأن يؤدي» / «بأن تؤدي» / «بأن يؤدوا» */
export function pays(form: PartyForm): string {
  return form === 'f' ? 'تؤدي' : form === 'pl' ? 'يؤدوا' : 'يؤدي'
}

/** «لموكلنا» / «لموكلتنا» — the client as the office refers to them */
export function ourClient(form: PartyForm, prefix = 'ل'): string {
  const word = form === 'f' ? 'موكلتنا' : form === 'pl' ? 'موكلينا' : 'موكلنا'
  return `${prefix}${word}`
}

/** «بمقر الدائن أو بمكتب وكيله» — the agent pronoun follows the creditor */
export function agentOf(form: PartyForm): string {
  return form === 'f' ? 'وكيلها' : form === 'pl' ? 'وكيلهم' : 'وكيله'
}

/** «سالف الذكر» agreeing with what it points back to */
export function aforementioned(form: PartyForm): string {
  return form === 'f' ? 'سالفة الذكر' : form === 'pl' ? 'سالفي الذكر' : 'سالف الذكر'
}

/**
 * The nationality as it is written beside a name: «كويتي الجنسية» for a man,
 * «كويتية الجنسية» for a woman. The stored labels are the masculine adjective,
 * and the feminine of an Arabic nisba is the masculine plus ة — which holds for
 * every label in the list that is an adjective at all.
 *
 * Five entries are country names rather than adjectives (جزر سليمان، سانت
 * كيتس ونيفيس …). They are returned unchanged, because adding ة to a country
 * name would be worse than leaving it; they are worth fixing in the data.
 */
export function nationalityPhrase(code: string, form: PartyForm): string {
  if (!code) return ''
  if (code === STATELESS) return 'بدون جنسية'

  const label = nationalityLabel(code)
  if (!label) return ''

  const feminine = form === 'f'
  // «كونغولي (جمهورية الكونغو الديمقراطية)» — the ة belongs on the adjective,
  // not after the clarification in brackets
  const open = label.indexOf(' (')
  const head = open === -1 ? label : label.slice(0, open)
  const tail = open === -1 ? '' : label.slice(open)

  const agreed = feminine && head.endsWith('ي') ? `${head}ة` : head
  return `${agreed}${tail} الجنسية`
}
