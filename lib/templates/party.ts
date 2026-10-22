/**
 * A party to the case — المدعي or المدعى عليه.
 *
 * EVERY pleading type asks about its two parties in exactly the same way, and
 * this file is the only place that says how. The same six shapes, the same
 * fields, the same rules, on both sides of every case. A new case type builds
 * its party sections with `partySection()` and adds nothing of its own, and
 * scripts/form-check.tsx fails if one ever tries.
 *
 * What is *not* shared is the sentence each document writes about a party: the
 * eviction petition and the financial claim describe the same company in
 * different words, and both wordings are the office's own. So this file holds
 * the data, the fields and the rules; each pleading holds its own prose.
 *
 * Only the zod field declarations are written out per side, in each template,
 * because a prefix computed at runtime would cost the schema its named types.
 */
import { z } from 'zod'
import { nationalityLabel, NATIONALITIES } from '@/lib/nationalities'
import type { FieldDef, SectionDef } from '@/lib/templates/types'

export const PARTY_TYPES = [
  'natural',
  'several',
  'heirs',
  'company',
  'licence',
  'government',
] as const
export type PartyType = (typeof PARTY_TYPES)[number]

/**
 * The shapes a party can take when it is not the state. A ministry can be
 * sued, but the office's clients are private parties, so «جهة حكومية» is
 * offered on the respondent's side only.
 */
export const PRIVATE_PARTY_TYPES = PARTY_TYPES.filter(
  (type) => type !== 'government',
) as readonly PartyType[]

export function isPartyType(value: string): value is PartyType {
  return (PARTY_TYPES as readonly string[]).includes(value)
}

/** Kuwaiti civil ID: twelve digits, no separators. */
export const CIVIL_ID_RE = /^\d{12}$/

/** Registration numbers are digits; lengths vary, so only the shape is fixed. */
export const DIGITS_RE = /^\d{4,15}$/

/**
 * Legal forms of a Kuwaiti company. The value is a stable code and the label is
 * what the pleading says, so rewording one never rewrites stored data.
 */
export const COMPANY_FORMS = [
  { value: 'llc', labelAr: 'ذات مسؤولية محدودة' },
  { value: 'single_person', labelAr: 'شركة الشخص الواحد' },
  { value: 'closed_shareholding', labelAr: 'شركة مساهمة مقفلة' },
  { value: 'general_partnership', labelAr: 'شركة تضامنية' },
  { value: 'limited_partnership', labelAr: 'شركة توصية بسيطة' },
  { value: 'partnership_by_shares', labelAr: 'شركة توصية بالأسهم' },
] as const

export const COMPANY_FORM_LABEL = new Map<string, string>(
  COMPANY_FORMS.map((f) => [f.value, f.labelAr]),
)

/** One named person in a repeatable list: an heir, or one of several parties. */
export const personSchema = z.object({
  name: z.string().trim().max(300).default(''),
  civil_id: z.string().trim().max(20).default(''),
  nationality: z.string().trim().max(40).default(''),
})

export type Person = z.infer<typeof personSchema>

/** the name this had while heirs were the only repeatable party */
export const heirSchema = personSchema
export type Heir = Person

/**
 * The two sides of every case. A pleading type does not get to name them, pick
 * their shapes, or decide which section they live in — that is what «exactly
 * the same way» means.
 *
 * They differ in one respect only: a government body can be sued but does not
 * sue through this portal, so «جهة حكومية» is offered to the respondent alone.
 */
export const PLAINTIFF = {
  prefix: 'plaintiff',
  labelAr: 'المدعي',
  sectionKey: 'plaintiff',
  types: PRIVATE_PARTY_TYPES,
} as const

export const DEFENDANT = {
  prefix: 'defendant',
  labelAr: 'المدعى عليه',
  sectionKey: 'defendant',
  types: PARTY_TYPES as readonly PartyType[],
} as const

export type PartySide = typeof PLAINTIFF | typeof DEFENDANT

/** Both sides, in the order every form shows them. */
export const PARTY_SIDES: readonly PartySide[] = [PLAINTIFF, DEFENDANT]

/** The zod declarations for one side. Spread into the schema under a prefix. */
export const partyShape = {
  /*
   * An unchosen صفة posts an empty string, and a request stored before these
   * screens existed has no key at all. Both mean the same thing — nobody has
   * picked yet — so both become undefined and fall to the legacy branch, which
   * reports in Arabic against the name field. Without this, `''` reaches the
   * enum and the client gets a raw zod message on a select that looks fine.
   */
  type: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.enum(PARTY_TYPES).optional(),
  ),
  /** free text from before the party types existed */
  name: z.string().trim().max(4000).default(''),

  full_name: z.string().trim().max(300).default(''),
  /*
   * «ذكر» or «أنثى». Arabic agrees with the person throughout a pleading —
   * «وأعلنته» against «وأعلنتها», «بأن يؤدي» against «بأن تؤدي» — so the one
   * fact that settles every one of those is asked once, here.
   */
  gender: z.string().trim().max(10).default(''),
  civil_id: z.string().trim().max(20).default(''),
  nationality: z.string().trim().max(40).default(''),

  /** أكثر من طرف: each person in their own right */
  persons: z.array(personSchema).max(40).default([]),

  deceased_name: z.string().trim().max(300).default(''),
  heirs: z.array(heirSchema).max(40).default([]),

  company_name: z.string().trim().max(300).default(''),
  company_form: z.string().trim().max(40).default(''),
  company_register: z.string().trim().max(40).default(''),
  company_civil_no: z.string().trim().max(20).default(''),

  /** جهة حكومية: وزارة، هيئة، بلدية — لا رقم مدني لها ولا سجل تجاري */
  government_name: z.string().trim().max(300).default(''),

  establishment_name: z.string().trim().max(300).default(''),
  owner_name: z.string().trim().max(300).default(''),
  owner_civil_id: z.string().trim().max(20).default(''),
  owner_nationality: z.string().trim().max(40).default(''),
  licence_register: z.string().trim().max(40).default(''),
  licence_civil_no: z.string().trim().max(20).default(''),
}

/** One side's values, lifted out of the flat schema by prefix. */
export type PartyValues = {
  type?: PartyType
  name: string
  full_name: string
  gender: string
  civil_id: string
  nationality: string
  persons: Person[]
  deceased_name: string
  heirs: Person[]
  company_name: string
  company_form: string
  company_register: string
  company_civil_no: string
  government_name: string
  establishment_name: string
  owner_name: string
  owner_civil_id: string
  owner_nationality: string
  licence_register: string
  licence_civil_no: string
}

const TEXT_KEYS = [
  'name',
  'full_name',
  'gender',
  'civil_id',
  'nationality',
  'deceased_name',
  'company_name',
  'company_form',
  'company_register',
  'company_civil_no',
  'government_name',
  'establishment_name',
  'owner_name',
  'owner_civil_id',
  'owner_nationality',
  'licence_register',
  'licence_civil_no',
] as const

/**
 * Pull `plaintiff_*` or `defendant_*` out of the flat values object. The schema
 * has already validated the shapes, so the casts here only re-narrow what zod
 * proved; a missing key becomes an empty string rather than undefined.
 */
export function readParty(
  values: Record<string, unknown>,
  prefix: string,
): PartyValues {
  const party = { heirs: [] } as unknown as PartyValues
  for (const key of TEXT_KEYS) {
    ;(party as Record<string, unknown>)[key] = String(values[`${prefix}_${key}`] ?? '')
  }
  const type = values[`${prefix}_type`]
  party.type = PARTY_TYPES.includes(type as PartyType) ? (type as PartyType) : undefined
  const rows = (key: string) => {
    const value = values[`${prefix}_${key}`]
    return Array.isArray(value) ? (value as Person[]) : []
  }
  party.heirs = rows('heirs')
  party.persons = rows('persons')
  return party
}

/**
 * The grammatical form this party takes in Arabic prose — which is what every
 * «وأعلنته / وأعلنتها / وأعلنتهم» in a pleading turns on.
 *
 * A company, an establishment and a government body are all feminine (الشركة،
 * المؤسسة، الجهة); heirs and several parties are plural; a natural person is
 * whatever they answered. A party with no صفة yet reads as masculine, which is
 * what the office's forms have always defaulted to.
 */
export function partyForm(party: PartyValues): 'm' | 'f' | 'pl' {
  switch (party.type) {
    case 'company':
    case 'licence':
    case 'government':
      return 'f'
    case 'heirs':
    case 'several':
      return 'pl'
    case 'natural':
      return party.gender === 'female' ? 'f' : 'm'
    default:
      return 'm'
  }
}

/** «فلان الفلاني – كويتي الجنسية – بطاقة مدنية رقم (000000000000)» */
export function personLine(name: string, civilId: string, nationality: string): string {
  return [
    name.trim(),
    nationality ? `${nationalityLabel(nationality)} الجنسية` : '',
    civilId ? `بطاقة مدنية رقم (${civilId})` : '',
  ]
    .filter(Boolean)
    .join(' – ')
}

type Issue = (ok: boolean, path: (string | number)[], message: string) => void

const filled = (s: string, min = 3) => s.trim().length >= min

/**
 * The per-type rules. `need` reports against the full dotted path, so an error
 * on the third heir's civil ID lands on that exact input.
 */
export function validateParty(
  party: PartyValues,
  prefix: string,
  need: Issue,
  labelAr: string,
): void {
  const CIVIL_ID_MSG = 'الرقم المدني يجب أن يتكوّن من 12 رقماً'
  const at = (key: string) => [`${prefix}_${key}`]

  /** every person in a repeatable list is checked the same way */
  const checkPersons = (people: Person[], key: string, noun: string) => {
    need(people.length > 0, at(key), `أضف ${noun} واحداً على الأقل`)
    people.forEach((person, i) => {
      const row = (field: string) => [`${prefix}_${key}`, i, field]
      need(filled(person.name), row('name'), `اسم ${noun} مطلوب`)
      need(CIVIL_ID_RE.test(person.civil_id), row('civil_id'), CIVIL_ID_MSG)
      need(filled(person.nationality, 2), row('nationality'), 'الجنسية مطلوبة')
    })
  }

  switch (party.type) {
    case 'natural':
      need(filled(party.full_name), at('full_name'), `اسم ${labelAr} مطلوب`)
      need(
        party.gender === 'male' || party.gender === 'female',
        at('gender'),
        'النوع مطلوب',
      )
      need(CIVIL_ID_RE.test(party.civil_id), at('civil_id'), CIVIL_ID_MSG)
      need(filled(party.nationality, 2), at('nationality'), 'الجنسية مطلوبة')
      break

    case 'several':
      checkPersons(party.persons, 'persons', 'طرف')
      need(party.persons.length > 1, at('persons'), 'أضف طرفاً ثانياً على الأقل')
      break

    case 'heirs':
      need(filled(party.deceased_name), at('deceased_name'), 'اسم المورِّث مطلوب')
      checkPersons(party.heirs, 'heirs', 'وريث')
      break

    case 'company':
      need(filled(party.company_name, 2), at('company_name'), 'اسم الشركة مطلوب')
      need(
        COMPANY_FORM_LABEL.has(party.company_form),
        at('company_form'),
        'شكل الشركة مطلوب',
      )
      need(
        DIGITS_RE.test(party.company_register),
        at('company_register'),
        'رقم السجل التجاري مطلوب (أرقام فقط)',
      )
      need(
        DIGITS_RE.test(party.company_civil_no),
        at('company_civil_no'),
        'رقم الجهة المدني مطلوب (أرقام فقط)',
      )
      break

    case 'government':
      need(
        filled(party.government_name, 2),
        at('government_name'),
        'اسم الجهة الحكومية مطلوب',
      )
      break

    case 'licence':
      need(
        filled(party.establishment_name, 2),
        at('establishment_name'),
        'اسم المنشأة مطلوب',
      )
      need(filled(party.owner_name), at('owner_name'), 'اسم صاحب المنشأة مطلوب')
      need(CIVIL_ID_RE.test(party.owner_civil_id), at('owner_civil_id'), CIVIL_ID_MSG)
      need(
        filled(party.owner_nationality, 2),
        at('owner_nationality'),
        'الجنسية مطلوبة',
      )
      need(
        DIGITS_RE.test(party.licence_register),
        at('licence_register'),
        'رقم السجل التجاري مطلوب (أرقام فقط)',
      )
      need(
        DIGITS_RE.test(party.licence_civil_no),
        at('licence_civil_no'),
        'رقم الجهة المدني مطلوب (أرقام فقط)',
      )
      break

    default:
      // a request submitted before the party types existed
      need(filled(party.name), at('name'), `اسم ${labelAr} مطلوب`)
  }
}

/**
 * One side's section, ready to drop into a template's `sections`. `extra` is
 * for what the *case* needs beyond the party — the eviction petition asks the
 * respondent for a service address, which is a fact about that case, not about
 * the party. The party fields themselves are never passed in and never
 * overridden.
 */
export function partySection(side: PartySide, extra: FieldDef[] = []): SectionDef {
  return {
    key: side.sectionKey,
    titleAr: side.labelAr,
    fields: [...partyFields(side.prefix, side.labelAr, side.types), ...extra],
  }
}

const nationalityOptions = NATIONALITIES.map((n) => ({
  value: n.value,
  labelAr: n.labelAr,
}))

/** «ذكر / أنثى» — what every agreement in the pleading turns on */
export const GENDER_OPTIONS = [
  { value: 'male', labelAr: 'ذكر' },
  { value: 'female', labelAr: 'أنثى' },
]

/** the three questions asked of each person in a repeatable list */
const personRowFields: FieldDef[] = [
  {
    name: 'name',
    width: 'name',
    labelAr: 'الإسم الكامل',
    type: 'text',
    required: true,
    placeholder: 'فلان الفلاني',
  },
  {
    name: 'civil_id',
    width: 'num',
    span: 6,
    labelAr: 'الرقم المدني',
    type: 'text',
    required: true,
    latinDigits: true,
    placeholder: '000000000000',
  },
  {
    name: 'nationality',
    searchable: true,
    optionIcon: 'flag',
    width: 'sel',
    span: 6,
    labelAr: 'الجنسية',
    type: 'select',
    required: true,
    options: nationalityOptions,
  },
]

/**
 * Every field for one side, in the order they appear in its section. The only
 * thing that differs between المدعي and المدعى عليه is the word in the first
 * label, which is why both sections are guaranteed to stay identical.
 */
export function partyFields(
  prefix: string,
  labelAr: string,
  /** which shapes this side may take; defaults to all of them */
  types: readonly PartyType[] = PARTY_TYPES,
): FieldDef[] {
  const n = (key: string) => `${prefix}_${key}`
  const only = (...wanted: PartyType[]) => ({ field: n('type'), equals: wanted })
  const offers = (type: PartyType) => types.includes(type)

  const fields: FieldDef[] = [
    {
      name: n('type'),
      width: 'sel',
      span: 5,
      labelAr: `صفة ${labelAr}`,
      hintAr: `تحدد هذه الصفة الحقول المطلوبة وصياغة اسم ${labelAr} في الصحيفة.`,
      type: 'select',
      required: true,
      options: (
        [
          { value: 'natural', labelAr: 'شخص طبيعي' },
          { value: 'several', labelAr: 'أكثر من طرف' },
          { value: 'heirs', labelAr: 'ورثة' },
          { value: 'company', labelAr: 'شركة' },
          { value: 'licence', labelAr: 'رخصة فردية' },
          { value: 'government', labelAr: 'جهة حكومية' },
        ] as const
      )
        .filter((option) => offers(option.value))
        .map((option) => ({ value: option.value, labelAr: option.labelAr })),
    },

    /*
     * Requests stored before the صفة existed carry the whole party as one
     * typed-out line. It is shown only while no صفة is chosen, which is
     * exactly when it is the live value — so the client can see what was
     * submitted, and it survives the round trip instead of being posted empty
     * by a form that has no input for it. Choosing a صفة unmounts this field,
     * which clears it: the structured fields are the value from then on.
     */
    {
      name: n('name'),
      labelAr: `اسم ${labelAr} كما ورد في الطلب السابق`,
      hintAr: `هذا الطلب أُرسل قبل إضافة «صفة ${labelAr}». اختر الصفة أعلاه لإدخال البيانات في حقول منفصلة، أو صحّح النص هنا كما هو.`,
      type: 'textarea',
      rows: 3,
      required: true,
      showWhen: { field: n('type'), equals: [''] },
    },

    /* --- شخص طبيعي --- */
    {
      name: n('full_name'),
      width: 'name',
      labelAr: 'الإسم الكامل',
      type: 'text',
      required: true,
      showWhen: only('natural'),
      placeholder: 'فلان الفلاني الفلاني',
    },
    {
      name: n('gender'),
      width: 'short',
      span: 4,
      labelAr: 'النوع',
      hintAr: 'تُضبط عليه ألفاظ التذكير والتأنيث في كل مواضع الصحيفة.',
      type: 'select',
      required: true,
      showWhen: only('natural'),
      options: GENDER_OPTIONS,
    },
    {
      name: n('civil_id'),
      width: 'num',
      span: 4,
      labelAr: 'الرقم المدني',
      hintAr: 'اثنا عشر رقماً كما تظهر على البطاقة المدنية، بدون فواصل.',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('natural'),
      placeholder: '000000000000',
    },
    {
      name: n('nationality'),
      searchable: true,
      optionIcon: 'flag',
      width: 'sel',
      span: 4,
      labelAr: 'الجنسية',
      type: 'select',
      required: true,
      showWhen: only('natural'),
      options: nationalityOptions,
    },

    /* --- ورثة --- */
    {
      name: n('deceased_name'),
      width: 'name',
      labelAr: 'اسم المورِّث (المتوفى)',
      hintAr: 'يُكتب في الصحيفة: «ورثة المرحوم/ …، وهم كل من:».',
      type: 'text',
      required: true,
      showWhen: only('heirs'),
      placeholder: 'فلان الفلاني الفلاني',
    },
    {
      name: n('heirs'),
      labelAr: 'الورثة',
      hintAr: 'كل وريث في سطر مستقل في الصحيفة، مرقّماً بالترتيب المدخل هنا.',
      type: 'rows',
      required: true,
      showWhen: only('heirs'),
      rowLabelAr: 'وريث',
      addLabelAr: 'إضافة وريث',
      minRows: 1,
      rowFields: personRowFields,
    },

    /* --- أكثر من طرف --- */
    {
      name: n('persons'),
      labelAr: `بيانات ${labelAr}`,
      hintAr: 'كل طرف في سطر مستقل في الصحيفة، مرقّماً بالترتيب المدخل هنا.',
      type: 'rows',
      required: true,
      showWhen: only('several'),
      rowLabelAr: 'طرف',
      addLabelAr: 'إضافة طرف',
      minRows: 2,
      rowFields: personRowFields,
    },

    /* --- جهة حكومية --- */
    {
      name: n('government_name'),
      width: 'org',
      labelAr: 'اسم الجهة الحكومية',
      hintAr: 'اسم الوزارة أو الهيئة أو البلدية كما هو في مراسلاتها الرسمية.',
      type: 'text',
      required: true,
      showWhen: only('government'),
      placeholder: 'وزارة ...',
    },

    /* --- شركة --- */
    {
      name: n('company_name'),
      width: 'org',
      labelAr: 'اسم الشركة',
      type: 'text',
      required: true,
      showWhen: only('company'),
      placeholder: 'شركة ... للتجارة العامة والمقاولات',
    },
    {
      name: n('company_form'),
      width: 'phrase',
      span: 6,
      labelAr: 'شكل الشركة',
      type: 'select',
      required: true,
      showWhen: only('company'),
      options: COMPANY_FORMS.map((f) => ({ value: f.value, labelAr: f.labelAr })),
    },
    {
      name: n('company_register'),
      width: 'reg',
      span: 6,
      labelAr: 'رقم السجل التجاري',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('company'),
      placeholder: '000000',
    },
    {
      name: n('company_civil_no'),
      width: 'reg',
      span: 6,
      labelAr: 'رقم الجهة المدني',
      hintAr: 'الرقم المدني للجهة الصادر من الهيئة العامة للمعلومات المدنية.',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('company'),
      placeholder: '000000000',
    },

    /* --- رخصة فردية --- */
    {
      name: n('establishment_name'),
      width: 'org',
      labelAr: 'اسم المنشأة (حسب رخصة وزارة التجارة)',
      type: 'text',
      required: true,
      showWhen: only('licence'),
      placeholder: 'مؤسسة ... للتجارة العامة',
    },
    {
      name: n('owner_name'),
      width: 'name',
      labelAr: 'اسم صاحب المنشأة الكامل',
      type: 'text',
      required: true,
      showWhen: only('licence'),
      placeholder: 'فلان الفلاني الفلاني',
    },
    {
      name: n('owner_civil_id'),
      width: 'num',
      span: 6,
      labelAr: 'الرقم المدني لصاحب المنشأة',
      hintAr: 'اثنا عشر رقماً كما تظهر على البطاقة المدنية، بدون فواصل.',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('licence'),
      placeholder: '000000000000',
    },
    {
      name: n('owner_nationality'),
      searchable: true,
      optionIcon: 'flag',
      width: 'sel',
      span: 6,
      labelAr: 'جنسية صاحب المنشأة',
      type: 'select',
      required: true,
      showWhen: only('licence'),
      options: nationalityOptions,
    },
    {
      name: n('licence_register'),
      width: 'reg',
      span: 6,
      labelAr: 'رقم السجل التجاري',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('licence'),
      placeholder: '000000',
    },
    {
      name: n('licence_civil_no'),
      width: 'reg',
      span: 6,
      labelAr: 'رقم الجهة المدني',
      hintAr: 'الرقم المدني للجهة الصادر من الهيئة العامة للمعلومات المدنية.',
      type: 'text',
      required: true,
      latinDigits: true,
      showWhen: only('licence'),
      placeholder: '000000000',
    },
  ]

  return fields.filter((field) => {
    // a field that exists only for a shape this side cannot take is dropped,
    // so restricting the صفة list cannot leave an orphan input behind it.
    // A value that is not a shape at all is left alone — the legacy name field
    // keys off '' , which means «no صفة chosen yet» and belongs to every side.
    const when = field.showWhen
    if (!when || when.field !== n('type')) return true
    return when.equals.some(
      (value) => !isPartyType(value) || offers(value as PartyType),
    )
  })
}
