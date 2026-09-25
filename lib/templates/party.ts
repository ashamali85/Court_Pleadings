/**
 * A party to the case — المدعي or المدعى عليه.
 *
 * Both sides are the same four shapes with the same rules and the same
 * sentence in the pleading, so everything with logic in it lives here once and
 * is parameterised by which side it is describing. Only the zod field
 * declarations are written out per side, in eviction.ts, because a prefix
 * computed at runtime would cost the schema its named types.
 */
import { z } from 'zod'
import { nationalityLabel, NATIONALITIES } from '@/lib/nationalities'
import type { FieldDef } from '@/lib/templates/types'

export const PARTY_TYPES = ['natural', 'heirs', 'company', 'licence'] as const
export type PartyType = (typeof PARTY_TYPES)[number]

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

export const heirSchema = z.object({
  name: z.string().trim().max(300).default(''),
  civil_id: z.string().trim().max(20).default(''),
  nationality: z.string().trim().max(40).default(''),
})

export type Heir = z.infer<typeof heirSchema>

/** The zod declarations for one side. Spread into the schema under a prefix. */
export const partyShape = {
  type: z.enum(PARTY_TYPES).optional(),
  /** free text from before the party types existed */
  name: z.string().trim().max(4000).default(''),

  full_name: z.string().trim().max(300).default(''),
  civil_id: z.string().trim().max(20).default(''),
  nationality: z.string().trim().max(40).default(''),

  deceased_name: z.string().trim().max(300).default(''),
  heirs: z.array(heirSchema).max(40).default([]),

  company_name: z.string().trim().max(300).default(''),
  company_form: z.string().trim().max(40).default(''),
  company_register: z.string().trim().max(40).default(''),
  company_civil_no: z.string().trim().max(20).default(''),

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
  civil_id: string
  nationality: string
  deceased_name: string
  heirs: Heir[]
  company_name: string
  company_form: string
  company_register: string
  company_civil_no: string
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
  'civil_id',
  'nationality',
  'deceased_name',
  'company_name',
  'company_form',
  'company_register',
  'company_civil_no',
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
  const heirs = values[`${prefix}_heirs`]
  party.heirs = Array.isArray(heirs) ? (heirs as Heir[]) : []
  return party
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

/** The party's block exactly as it is written into the .docx. */
export function partyLine(party: PartyValues): string {
  switch (party.type) {
    case 'natural':
      return personLine(party.full_name, party.civil_id, party.nationality)

    case 'heirs': {
      const heirs = party.heirs
        .filter((h) => h.name.trim())
        .map((h, i) => `${i + 1}- ${personLine(h.name, h.civil_id, h.nationality)}`)
        .join('\n')
      const head = `ورثة المرحوم/ ${party.deceased_name.trim()}، وهم كل من:`
      return heirs ? `${head}\n${heirs}` : head
    }

    case 'company':
      return [
        party.company_name.trim(),
        COMPANY_FORM_LABEL.get(party.company_form) ?? '',
        party.company_register ? `سجل تجاري رقم (${party.company_register})` : '',
        party.company_civil_no ? `رقم الجهة المدني (${party.company_civil_no})` : '',
      ]
        .filter(Boolean)
        .join(' – ')

    case 'licence': {
      /*
       * «صيدلية راما لصاحبها علي محمود العريان – كويتي الجنسية – بطاقة مدنية
       *  رقم (…) – سجل تجاري رقم (…) – رقم الجهة المدني (…)»
       *
       * The owner follows the establishment immediately, and the licence's own
       * numbers close the line — so the reader gets the establishment, then
       * the person answerable for it, then the registrations.
       *
       * «لصاحبها» agrees with a feminine establishment (صيدلية، مؤسسة، شركة),
       * which is what this office's pleadings use.
       */
      const owner = personLine(
        party.owner_name,
        party.owner_civil_id,
        party.owner_nationality,
      )
      const establishment = party.establishment_name.trim()
      const head = owner ? `${establishment} لصاحبها ${owner}` : establishment

      return [
        head,
        party.licence_register ? `سجل تجاري رقم (${party.licence_register})` : '',
        party.licence_civil_no ? `رقم الجهة المدني (${party.licence_civil_no})` : '',
      ]
        .filter(Boolean)
        .join(' – ')
    }

    default:
      // submitted before the party types existed: the client typed the block
      return party.name
  }
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

  switch (party.type) {
    case 'natural':
      need(filled(party.full_name), at('full_name'), `اسم ${labelAr} مطلوب`)
      need(CIVIL_ID_RE.test(party.civil_id), at('civil_id'), CIVIL_ID_MSG)
      need(filled(party.nationality, 2), at('nationality'), 'الجنسية مطلوبة')
      break

    case 'heirs':
      need(filled(party.deceased_name), at('deceased_name'), 'اسم المورِّث مطلوب')
      need(party.heirs.length > 0, at('heirs'), 'أضف وريثاً واحداً على الأقل')
      party.heirs.forEach((heir, i) => {
        const row = (key: string) => [`${prefix}_heirs`, i, key]
        need(filled(heir.name), row('name'), 'اسم الوريث مطلوب')
        need(CIVIL_ID_RE.test(heir.civil_id), row('civil_id'), CIVIL_ID_MSG)
        need(filled(heir.nationality, 2), row('nationality'), 'الجنسية مطلوبة')
      })
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

const nationalityOptions = NATIONALITIES.map((n) => ({
  value: n.value,
  labelAr: n.labelAr,
}))

/**
 * Every field for one side, in the order they appear in its section. The only
 * thing that differs between المدعي and المدعى عليه is the word in the first
 * label, which is why both sections are guaranteed to stay identical.
 */
export function partyFields(prefix: string, labelAr: string): FieldDef[] {
  const n = (key: string) => `${prefix}_${key}`
  const only = (...types: PartyType[]) => ({ field: n('type'), equals: types })

  return [
    {
      name: n('type'),
      width: 'sel',
      span: 5,
      labelAr: `صفة ${labelAr}`,
      hintAr: `تحدد هذه الصفة الحقول المطلوبة وصياغة اسم ${labelAr} في الصحيفة.`,
      type: 'select',
      required: true,
      options: [
        { value: 'natural', labelAr: 'شخص طبيعي' },
        { value: 'heirs', labelAr: 'ورثة' },
        { value: 'company', labelAr: 'شركة' },
        { value: 'licence', labelAr: 'رخصة فردية' },
      ],
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
      name: n('civil_id'),
      width: 'num',
      span: 6,
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
      span: 6,
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
      rowFields: [
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
      ],
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
}
