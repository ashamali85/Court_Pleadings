/**
 * سند الدين — the instrument the debt is written in.
 *
 * Two things hang off the choice. First the wording: each kind is described in
 * its own sentence inside «وذلك ثابت بموجب …»، and referred back to later as
 * «الشيك سالف الذكر» or «الفواتير سالفة الذكر». Second, and more consequential,
 * how many documents the office delivers: a commercial paper (شيك، كمبيالة،
 * سند إذني) means the claim must first go through a payment order, so the
 * client gets four documents instead of two.
 *
 * One row describes one instrument. Several invoices are several rows, which
 * is what lets each carry its own number, date and amount — the office's rule
 * for تعدد السندات, settled 2026-09-26.
 *
 * Source: docs/business-rules/template-notes.md, questions 8 and 9 and the
 * «عدد المخرجات حسب نوع سند الدين» rule of 2026-10-02.
 */
import { moneyPhrase } from '@/lib/claim/money'
import { longDateAr } from '@/lib/numerals'

export const INSTRUMENT_KINDS = [
  'cheque',
  'bill_of_exchange',
  'promissory_note',
  'notarised_acknowledgement',
  'private_acknowledgement',
  'account_statement',
  'invoice',
  'other',
] as const

export type InstrumentKind = (typeof INSTRUMENT_KINDS)[number]

type Spec = {
  /** what the client picks from the list */
  labelAr: string
  /** «الشيك» — one of them, with the article */
  one: string
  /** «الفواتير» — several of the same kind */
  many: string
  /** feminine nouns take «سالفة الذكر» */
  feminine: boolean
  /** الورقة التجارية — a payment order must be attempted before suing */
  commercialPaper: boolean
  /** does the form ask for a serial number? إقرار عرفي has none */
  hasNumber: boolean
  /** الشيك only — اسم البنك المسحوب عليه، وهل رُدّ */
  hasBank?: boolean
  /** فواتير وكشف الحساب — مذيل بختم أو توقيع المعلن إليه */
  hasStamp?: boolean
}

const SPECS: Record<InstrumentKind, Spec> = {
  cheque: {
    labelAr: 'شيك',
    one: 'الشيك',
    many: 'الشيكات',
    feminine: false,
    commercialPaper: true,
    hasNumber: true,
    hasBank: true,
  },
  bill_of_exchange: {
    labelAr: 'كمبيالة',
    one: 'الكمبيالة',
    many: 'الكمبيالات',
    feminine: true,
    commercialPaper: true,
    hasNumber: true,
  },
  promissory_note: {
    labelAr: 'سند إذني',
    one: 'السند الإذني',
    many: 'السندات الإذنية',
    feminine: false,
    commercialPaper: true,
    hasNumber: true,
  },
  notarised_acknowledgement: {
    labelAr: 'إقرار دين رسمي موثق لدى وزارة العدل',
    one: 'الإقرار',
    many: 'الإقرارات',
    feminine: false,
    commercialPaper: false,
    hasNumber: true,
  },
  private_acknowledgement: {
    labelAr: 'إقرار دين عرفي',
    one: 'الإقرار',
    many: 'الإقرارات',
    feminine: false,
    commercialPaper: false,
    hasNumber: false,
  },
  account_statement: {
    labelAr: 'كشف حساب',
    one: 'كشف الحساب',
    many: 'كشوف الحساب',
    feminine: false,
    commercialPaper: false,
    hasNumber: true,
    hasStamp: true,
  },
  invoice: {
    labelAr: 'فاتورة',
    one: 'الفاتورة',
    many: 'الفواتير',
    feminine: true,
    commercialPaper: false,
    hasNumber: true,
    hasStamp: true,
  },
  other: {
    labelAr: 'أخرى',
    one: 'السند',
    many: 'السندات',
    feminine: false,
    commercialPaper: false,
    hasNumber: false,
  },
}

export const INSTRUMENT_OPTIONS = INSTRUMENT_KINDS.map((value) => ({
  value,
  labelAr: SPECS[value].labelAr,
}))

export function instrumentSpec(kind: InstrumentKind): Spec {
  return SPECS[kind]
}

export function isInstrumentKind(value: string): value is InstrumentKind {
  return (INSTRUMENT_KINDS as readonly string[]).includes(value)
}

/** One instrument as the client describes it. Blank fields are simply omitted. */
export type Instrument = {
  kind: InstrumentKind
  /** رقم الشيك / رقم الفاتورة */
  number: string
  /** d/m/yyyy */
  date: string
  /** الشيك: اسم البنك المسحوب عليه */
  bank: string
  /** الشيك: هل رُدّ من البنك؟ */
  returned: boolean
  /** فاتورة / كشف حساب: مذيّل بختم أو توقيع المعلن إليه بما يفيد الاستلام */
  stamped: boolean
  /** أخرى: the client writes the instrument themselves */
  text: string
  /** عند تعدد السندات: مبلغ هذا السند وحده */
  amount: number
}

export function blankInstrument(): Instrument {
  return {
    kind: 'cheque',
    number: '',
    date: '',
    bank: '',
    returned: false,
    stamped: false,
    text: '',
    amount: 0,
  }
}

/** هل بين السندات ورقة تجارية؟ ولو واحدة، فالمخرجات أربعة. */
export function hasCommercialPaper(instruments: Instrument[]): boolean {
  return instruments.some((i) => SPECS[i.kind]?.commercialPaper)
}

const aforementioned = (feminine: boolean) => (feminine ? 'سالفة الذكر' : 'سالف الذكر')

/**
 * «الشيك سالف الذكر» / «الفواتير سالفة الذكر» / «السندات سالفة الذكر».
 * Instruments of one kind keep that kind's word; a mixture becomes «السندات».
 */
export function backReference(instruments: Instrument[]): string {
  if (instruments.length === 0) return ''

  const kinds = new Set(instruments.map((i) => i.kind))
  if (kinds.size > 1) return `السندات ${aforementioned(true)}`

  const spec = SPECS[instruments[0].kind]
  const noun = instruments.length > 1 ? spec.many : spec.one
  // a broken plural of a thing agrees as feminine singular: «الفواتير سالفة الذكر»
  const feminine = instruments.length > 1 ? true : spec.feminine
  return `${noun} ${aforementioned(feminine)}`
}

/** «السند» / «السندات» — for the sentence that counts them */
export function instrumentWord(instruments: Instrument[]): string {
  return instruments.length > 1 ? 'السندات' : 'السند'
}

const numbered = (value: string, feminine: boolean) =>
  value.trim() ? `${feminine ? ' رقم' : ' رقم'} (${value.trim()})` : ''

const dated = (value: string, feminine: boolean) => {
  const long = longDateAr(value)
  return long ? ` ${feminine ? 'المؤرخة' : 'المؤرخ'} ${long}` : ''
}

/**
 * The instrument, written the way the document it appears in writes it.
 *
 * The office's two approved outputs phrase the same instrument differently,
 * and the difference is not decoration:
 *
 *   subject    …ثابت بموجب فاتورة ممهورة بختم وتوقيع المعلن إليه بما يثبت
 *              الاستلام، ورقمها (12345)، وتاريخها 30 أغسطس 2025
 *   reference  …وإلى الفاتورة رقم (12345) المؤرخة 30 أغسطس 2025
 *
 * The subject paragraph introduces the instrument, so a stamped invoice is
 * indefinite and leads with the stamp — the stamp is what makes it evidence of
 * delivery. Everything afterwards points back at it with the article.
 *
 * A cheque is the exception: it is definite in both, and always carries its
 * amount and, if it bounced, says so, because that is the office's own
 * sentence for a returned cheque.
 */
export type InstrumentStyle = 'subject' | 'reference'

export function describeInstrument(
  instrument: Instrument,
  options: {
    respondent?: string
    withAmount?: boolean
    style?: InstrumentStyle
  } = {},
): string {
  const { kind, number, date, bank, returned, stamped, text, amount } = instrument
  const spec = SPECS[kind]
  const respondent = options.respondent ?? 'المعلن إليه'
  const style = options.style ?? 'subject'

  if (kind === 'other') return text.trim()

  // a cheque's amount belongs to the sentence that introduces it; pointing
  // back at it later just names it — «وإلى الشيك رقم (…) المؤرخ …»
  const introducing = style === 'subject'
  const showAmount = (options.withAmount || kind === 'cheque') && introducing
  const amountPart = showAmount && amount > 0 ? ` بمبلغ ${moneyPhrase(amount)}` : ''

  if (kind === 'cheque') {
    const drawn = introducing && bank.trim() ? ` المسحوب على ${bank.trim()}` : ''
    const bounced = introducing && returned ? '، وقد رُدّ الشيك من البنك' : ''
    return `${spec.one}${numbered(number, false)}${dated(date, false)}${drawn}${amountPart}${bounced}`
  }

  if (style === 'subject' && stamped && spec.hasStamp) {
    // «فاتورة ممهورة … ، ورقمها (12345)، وتاريخها 30 أغسطس 2025»
    const indefinite = spec.one.replace(/^ال/, '')
    const head = `${indefinite} ${spec.feminine ? 'ممهورة' : 'ممهور'} بختم وتوقيع ${respondent} بما يثبت الاستلام`
    const its = spec.feminine ? ['ورقمها', 'وتاريخها'] : ['ورقمه', 'وتاريخه']
    const parts = [head]
    if (number.trim()) parts.push(`${its[0]} (${number.trim()})`)
    const long = longDateAr(date)
    if (long) parts.push(`${its[1]} ${long}`)
    return `${parts.join('، ')}${amountPart}`
  }

  return `${spec.one}${numbered(number, spec.feminine)}${dated(date, spec.feminine)}${amountPart}`
}

/** «المستحق عليكم» / «المستحقة عليكم» — agrees with the instrument named */
export function dueFrom(instruments: Instrument[]): string {
  if (instruments.length === 0) return 'المستحق'
  const plural = instruments.length > 1
  const feminine = plural || SPECS[instruments[0].kind].feminine
  return feminine ? 'المستحقة' : 'المستحق'
}

/**
 * The instruments as one run of text inside the subject paragraph. With more
 * than one, each carries its own amount so the reader can add them up.
 */
export function describeInstruments(
  instruments: Instrument[],
  respondent: string,
  style: InstrumentStyle = 'subject',
): string {
  if (instruments.length === 0) return ''
  if (instruments.length === 1) {
    return describeInstrument(instruments[0], { respondent, style })
  }
  return instruments
    .map((i) => describeInstrument(i, { respondent, style, withAmount: true }))
    .join('، و')
}

/** «صورة ضوئية من (الشيك رقم 000123)» — one exhibit row per instrument */
export function exhibitDescription(instrument: Instrument): string {
  const spec = SPECS[instrument.kind]
  if (instrument.kind === 'other') {
    return `صورة ضوئية من (${instrument.text.trim() || 'سند الدين'})`
  }
  const number = instrument.number.trim()
  return `صورة ضوئية من (${spec.one}${number ? ` رقم ${number}` : ''})`
}

/**
 * The per-instrument amounts must add up to the claim. The office asks to be
 * warned, not blocked — a cheque issued for part of a larger debt is a real
 * case (takleef-notes, «صياغة السندات المتداخلة») — so this reports the gap
 * and lets the caller decide what to do about it.
 */
export function amountsReconcile(
  instruments: Instrument[],
  claimAmount: number,
): { ok: boolean; total: number; difference: number } {
  const total = instruments.reduce((sum, i) => sum + (i.amount || 0), 0)
  const difference = Math.round((total - claimAmount) * 1000) / 1000
  return { ok: Math.abs(difference) < 0.0005, total, difference }
}
