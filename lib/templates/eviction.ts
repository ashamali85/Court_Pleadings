import { z } from 'zod'
import { nationalityLabel, NATIONALITIES } from '@/lib/nationalities'
import { weekdayAr } from '@/lib/numerals'
import { amountToArabicWords, formatAmount } from '@/lib/tafqeet'
import type { FieldDef, Placeholders, TemplateDef } from '@/lib/templates/types'

const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  labelAr: String(i + 1),
}))

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 12 }, (_, i) => {
  const y = currentYear + 1 - i
  return { value: String(y), labelAr: String(y) }
})

export const PARTY_TYPES = ['natural', 'heirs', 'company', 'licence'] as const
export type PartyType = (typeof PARTY_TYPES)[number]

/** Kuwaiti civil ID: twelve digits, no separators. */
const CIVIL_ID_RE = /^\d{12}$/

/** Registration numbers are digits; lengths vary, so only the shape is fixed. */
const DIGITS_RE = /^\d{4,15}$/

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

const COMPANY_FORM_LABEL = new Map<string, string>(
  COMPANY_FORMS.map((f) => [f.value, f.labelAr]),
)

const heirSchema = z.object({
  name: z.string().trim().max(300).default(''),
  civil_id: z.string().trim().max(20).default(''),
  nationality: z.string().trim().max(40).default(''),
})

export type Heir = z.infer<typeof heirSchema>

export const evictionSchema = z
  .object({
    /* the plaintiff is one of four shapes; the fields for the other three are
       absent from the form, so each one is validated only when it is chosen.
       plaintiff_type is optional because requests submitted before this screen
       existed carry a free-text plaintiff_name and no type at all. */
    plaintiff_type: z.enum(PARTY_TYPES).optional(),
    plaintiff_name: z.string().trim().max(4000).default(''),

    plaintiff_full_name: z.string().trim().max(300).default(''),
    plaintiff_civil_id: z.string().trim().max(20).default(''),
    plaintiff_nationality: z.string().trim().max(40).default(''),

    plaintiff_deceased_name: z.string().trim().max(300).default(''),
    plaintiff_heirs: z.array(heirSchema).max(40).default([]),

    plaintiff_company_name: z.string().trim().max(300).default(''),
    plaintiff_company_form: z.string().trim().max(40).default(''),
    plaintiff_company_register: z.string().trim().max(40).default(''),
    plaintiff_company_civil_no: z.string().trim().max(20).default(''),

    plaintiff_establishment_name: z.string().trim().max(300).default(''),
    plaintiff_owner_name: z.string().trim().max(300).default(''),
    plaintiff_owner_civil_id: z.string().trim().max(20).default(''),
    plaintiff_owner_nationality: z.string().trim().max(40).default(''),
    plaintiff_licence_register: z.string().trim().max(40).default(''),
    plaintiff_licence_civil_no: z.string().trim().max(20).default(''),

    defendant_name: z.string().trim().min(3, 'اسم المعلن إليه مطلوب').max(1000),
    defendant_address: z.string().trim().min(3, 'عنوان المعلن إليه مطلوب').max(2000),
    premises_same_as_defendant: z.boolean(),
    premises_address: z.string().trim().max(2000),
    premises_lead: z.string().trim().min(2).max(60),
    lease_date: z
      .string()
      .trim()
      .regex(DATE_RE, 'صيغة التاريخ يجب أن تكون يوم/شهر/سنة مثال 19/5/2019'),
    property_use: z.string().trim().min(2, 'غرض الاستعمال مطلوب').max(300),
    monthly_rent: z.coerce
      .number({ error: 'قيمة الأجرة الشهرية مطلوبة' })
      .positive('يجب أن تكون الأجرة أكبر من صفر')
      .max(1_000_000),
    nonpayment_start_date: z.string().trim().max(20),
    arrears_from_month: z.coerce.number().int().min(1).max(12),
    arrears_to_month: z.coerce.number().int().min(1).max(12),
    arrears_year: z.coerce.number().int().min(2000).max(2100),
    include_eviction_request: z.boolean(),
    include_penalty_clause: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const need = (ok: boolean, path: (string | number)[], message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path, message })
    }
    const filled = (s: string, min = 3) => s.trim().length >= min
    const CIVIL_ID_MSG = 'الرقم المدني يجب أن يتكوّن من 12 رقماً'

    switch (v.plaintiff_type) {
      case 'natural':
        need(filled(v.plaintiff_full_name), ['plaintiff_full_name'], 'اسم الطالب مطلوب')
        need(
          CIVIL_ID_RE.test(v.plaintiff_civil_id),
          ['plaintiff_civil_id'],
          CIVIL_ID_MSG,
        )
        need(
          filled(v.plaintiff_nationality, 2),
          ['plaintiff_nationality'],
          'الجنسية مطلوبة',
        )
        break

      case 'heirs':
        need(
          filled(v.plaintiff_deceased_name),
          ['plaintiff_deceased_name'],
          'اسم المورِّث مطلوب',
        )
        need(
          v.plaintiff_heirs.length > 0,
          ['plaintiff_heirs'],
          'أضف وريثاً واحداً على الأقل',
        )
        v.plaintiff_heirs.forEach((heir, i) => {
          need(filled(heir.name), ['plaintiff_heirs', i, 'name'], 'اسم الوريث مطلوب')
          need(
            CIVIL_ID_RE.test(heir.civil_id),
            ['plaintiff_heirs', i, 'civil_id'],
            CIVIL_ID_MSG,
          )
          need(
            filled(heir.nationality, 2),
            ['plaintiff_heirs', i, 'nationality'],
            'الجنسية مطلوبة',
          )
        })
        break

      case 'company':
        need(
          filled(v.plaintiff_company_name, 2),
          ['plaintiff_company_name'],
          'اسم الشركة مطلوب',
        )
        need(
          COMPANY_FORM_LABEL.has(v.plaintiff_company_form),
          ['plaintiff_company_form'],
          'شكل الشركة مطلوب',
        )
        need(
          DIGITS_RE.test(v.plaintiff_company_register),
          ['plaintiff_company_register'],
          'رقم السجل التجاري مطلوب (أرقام فقط)',
        )
        need(
          DIGITS_RE.test(v.plaintiff_company_civil_no),
          ['plaintiff_company_civil_no'],
          'رقم الجهة المدني مطلوب (أرقام فقط)',
        )
        break

      case 'licence':
        need(
          filled(v.plaintiff_establishment_name, 2),
          ['plaintiff_establishment_name'],
          'اسم المنشأة مطلوب',
        )
        need(
          filled(v.plaintiff_owner_name),
          ['plaintiff_owner_name'],
          'اسم صاحب المنشأة مطلوب',
        )
        need(
          CIVIL_ID_RE.test(v.plaintiff_owner_civil_id),
          ['plaintiff_owner_civil_id'],
          CIVIL_ID_MSG,
        )
        need(
          filled(v.plaintiff_owner_nationality, 2),
          ['plaintiff_owner_nationality'],
          'الجنسية مطلوبة',
        )
        need(
          DIGITS_RE.test(v.plaintiff_licence_register),
          ['plaintiff_licence_register'],
          'رقم السجل التجاري مطلوب (أرقام فقط)',
        )
        need(
          DIGITS_RE.test(v.plaintiff_licence_civil_no),
          ['plaintiff_licence_civil_no'],
          'رقم الجهة المدني مطلوب (أرقام فقط)',
        )
        break

      default:
        // a request submitted before the party types existed
        need(filled(v.plaintiff_name), ['plaintiff_name'], 'اسم الطالب مطلوب')
    }

    if (v.arrears_to_month < v.arrears_from_month) {
      ctx.addIssue({
        code: 'custom',
        path: ['arrears_to_month'],
        message: 'شهر النهاية يجب أن يكون بعد شهر البداية أو مساوياً له',
      })
    }
    if (!v.premises_same_as_defendant && v.premises_address.length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['premises_address'],
        message: 'عنوان العين المؤجرة مطلوب',
      })
    }
    if (v.nonpayment_start_date && !DATE_RE.test(v.nonpayment_start_date)) {
      ctx.addIssue({
        code: 'custom',
        path: ['nonpayment_start_date'],
        message: 'صيغة التاريخ يجب أن تكون يوم/شهر/سنة',
      })
    }
  })

export type EvictionValues = z.infer<typeof evictionSchema>

export const evictionDefaults: EvictionValues = {
  plaintiff_type: 'natural',
  plaintiff_name: '',
  plaintiff_full_name: '',
  plaintiff_civil_id: '',
  plaintiff_nationality: 'KW',
  plaintiff_deceased_name: '',
  plaintiff_heirs: [{ name: '', civil_id: '', nationality: 'KW' }],
  plaintiff_company_name: '',
  plaintiff_company_form: '',
  plaintiff_company_register: '',
  plaintiff_company_civil_no: '',
  plaintiff_establishment_name: '',
  plaintiff_owner_name: '',
  plaintiff_owner_civil_id: '',
  plaintiff_owner_nationality: 'KW',
  plaintiff_licence_register: '',
  plaintiff_licence_civil_no: '',
  defendant_name: '',
  defendant_address: '',
  premises_same_as_defendant: true,
  premises_address: '',
  premises_lead: 'الشقة الكائنة في',
  lease_date: '',
  property_use: '',
  monthly_rent: 0,
  nonpayment_start_date: '',
  arrears_from_month: 1,
  arrears_to_month: 1,
  arrears_year: currentYear,
  include_eviction_request: true,
  include_penalty_clause: true,
}

const ORDINALS = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً']

const fields: Record<string, FieldDef> = {
  plaintiff_type: {
    name: 'plaintiff_type',
    width: 'sel',
    span: 5,
    labelAr: 'صفة الطالب',
    hintAr: 'تحدد هذه الصفة الحقول المطلوبة وصياغة اسم الطالب في الصحيفة.',
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
  plaintiff_full_name: {
    name: 'plaintiff_full_name',
    width: 'name',
    labelAr: 'الإسم الكامل',
    type: 'text',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['natural'] },
    placeholder: 'فلان الفلاني الفلاني',
  },
  plaintiff_civil_id: {
    name: 'plaintiff_civil_id',
    width: 'num',
    span: 6,
    labelAr: 'الرقم المدني',
    hintAr: 'اثنا عشر رقماً كما تظهر على البطاقة المدنية، بدون فواصل.',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['natural'] },
    placeholder: '000000000000',
  },
  plaintiff_nationality: {
    name: 'plaintiff_nationality',
    searchable: true,
    optionIcon: 'flag',
    width: 'sel',
    span: 6,
    labelAr: 'الجنسية',
    type: 'select',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['natural'] },
    options: NATIONALITIES.map((n) => ({ value: n.value, labelAr: n.labelAr })),
  },

  /* --- ورثة --- */
  plaintiff_deceased_name: {
    name: 'plaintiff_deceased_name',
    width: 'name',
    labelAr: 'اسم المورِّث (المتوفى)',
    hintAr: 'يُكتب في الصحيفة: «ورثة المرحوم/ …، وهم كل من:».',
    type: 'text',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['heirs'] },
    placeholder: 'فلان الفلاني الفلاني',
  },
  plaintiff_heirs: {
    name: 'plaintiff_heirs',
    labelAr: 'الورثة',
    hintAr: 'كل وريث في سطر مستقل في الصحيفة، مرقّماً بالترتيب المدخل هنا.',
    type: 'rows',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['heirs'] },
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
        options: NATIONALITIES.map((n) => ({ value: n.value, labelAr: n.labelAr })),
      },
    ],
  },

  /* --- شركة --- */
  plaintiff_company_name: {
    name: 'plaintiff_company_name',
    width: 'org',
    labelAr: 'اسم الشركة',
    type: 'text',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['company'] },
    placeholder: 'شركة ... للتجارة العامة والمقاولات',
  },
  plaintiff_company_form: {
    name: 'plaintiff_company_form',
    width: 'phrase',
    span: 6,
    labelAr: 'شكل الشركة',
    type: 'select',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['company'] },
    options: COMPANY_FORMS.map((f) => ({ value: f.value, labelAr: f.labelAr })),
  },
  plaintiff_company_register: {
    name: 'plaintiff_company_register',
    width: 'reg',
    span: 6,
    labelAr: 'رقم السجل التجاري',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['company'] },
    placeholder: '000000',
  },
  plaintiff_company_civil_no: {
    name: 'plaintiff_company_civil_no',
    width: 'reg',
    span: 6,
    labelAr: 'رقم الجهة المدني',
    hintAr: 'الرقم المدني للجهة الصادر من الهيئة العامة للمعلومات المدنية.',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['company'] },
    placeholder: '000000000',
  },

  /* --- رخصة فردية --- */
  plaintiff_establishment_name: {
    name: 'plaintiff_establishment_name',
    width: 'org',
    labelAr: 'اسم المنشأة (حسب رخصة وزارة التجارة)',
    type: 'text',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    placeholder: 'مؤسسة ... للتجارة العامة',
  },
  plaintiff_owner_name: {
    name: 'plaintiff_owner_name',
    width: 'name',
    labelAr: 'اسم صاحب المنشأة الكامل',
    type: 'text',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    placeholder: 'فلان الفلاني الفلاني',
  },
  plaintiff_owner_civil_id: {
    name: 'plaintiff_owner_civil_id',
    width: 'num',
    span: 6,
    labelAr: 'الرقم المدني لصاحب المنشأة',
    hintAr: 'اثنا عشر رقماً كما تظهر على البطاقة المدنية، بدون فواصل.',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    placeholder: '000000000000',
  },
  plaintiff_owner_nationality: {
    name: 'plaintiff_owner_nationality',
    searchable: true,
    optionIcon: 'flag',
    width: 'sel',
    span: 6,
    labelAr: 'جنسية صاحب المنشأة',
    type: 'select',
    required: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    options: NATIONALITIES.map((n) => ({ value: n.value, labelAr: n.labelAr })),
  },
  plaintiff_licence_register: {
    name: 'plaintiff_licence_register',
    width: 'reg',
    span: 6,
    labelAr: 'رقم السجل التجاري',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    placeholder: '000000',
  },
  plaintiff_licence_civil_no: {
    name: 'plaintiff_licence_civil_no',
    width: 'reg',
    span: 6,
    labelAr: 'رقم الجهة المدني',
    hintAr: 'الرقم المدني للجهة الصادر من الهيئة العامة للمعلومات المدنية.',
    type: 'text',
    required: true,
    latinDigits: true,
    showWhen: { field: 'plaintiff_type', equals: ['licence'] },
    placeholder: '000000000',
  },

  defendant_name: {
    name: 'defendant_name',
    labelAr: 'اسم المعلن إليه (المدعى عليه)',
    hintAr: 'الاسم الرباعي مع الجنسية ورقم البطاقة المدنية.',
    type: 'text',
    required: true,
    placeholder: 'فلان الفلاني – أردني الجنسية – بطاقة مدنية رقم (000000000000)',
  },
  defendant_address: {
    name: 'defendant_address',
    labelAr: 'عنوان المعلن إليه',
    hintAr: 'المنطقة، القطعة، الشارع، القسيمة، رقم العين، الدور، والرقم الآلي.',
    type: 'textarea',
    rows: 4,
    required: true,
  },
  premises_same_as_defendant: {
    name: 'premises_same_as_defendant',
    labelAr: 'عنوان العين المؤجرة هو نفسه عنوان المعلن إليه',
    type: 'boolean',
  },
  premises_lead: {
    name: 'premises_lead',
    width: 'sel',
    span: 5,
    labelAr: 'نوع العين المؤجرة',
    hintAr: 'تُكتب في الصحيفة قبل العنوان: «يستأجر المعلن إليه من الطالب …».',
    type: 'select',
    required: true,
    options: [
      { value: 'الشقة الكائنة في', labelAr: 'شقة' },
      { value: 'المحل الكائن في', labelAr: 'محل تجاري' },
      { value: 'المخزن الكائن في', labelAr: 'مخزن' },
      { value: 'المكتب الكائن في', labelAr: 'مكتب' },
      { value: 'الفيلا الكائنة في', labelAr: 'فيلا / منزل' },
      { value: 'العين المؤجرة الكائنة في', labelAr: 'أخرى (عين مؤجرة)' },
    ],
  },
  premises_address: {
    name: 'premises_address',
    labelAr: 'عنوان العين المؤجرة',
    type: 'textarea',
    rows: 4,
    mirrorOf: 'defendant_address',
    hiddenWhen: 'premises_same_as_defendant',
  },
  lease_date: {
    name: 'lease_date',
    width: 'date',
    span: 6,
    labelAr: 'تاريخ عقد الإيجار',
    hintAr: 'اختر التاريخ من التقويم. يُستخرج اسم اليوم تلقائياً للصحيفة.',
    type: 'date',
    required: true,
    placeholder: 'يوم/شهر/سنة',
  },
  property_use: {
    name: 'property_use',
    width: 'name',
    span: 6,
    labelAr: 'غرض استعمال العين المؤجرة',
    type: 'text',
    required: true,
    placeholder: 'سكن عائلي',
  },
  monthly_rent: {
    name: 'monthly_rent',
    width: 'money',
    span: 6,
    latinDigits: true,
    labelAr: 'قيمة الأجرة الشهرية (د.ك)',
    hintAr: 'الرقم فقط، مثال 450 أو 450.500. يُكتب المبلغ بالحروف تلقائياً في الصحيفة.',
    type: 'number',
    required: true,
    placeholder: '470',
  },
  nonpayment_start_date: {
    name: 'nonpayment_start_date',
    width: 'date',
    labelAr: 'تاريخ بدء الامتناع عن سداد الأجرة (اختياري)',
    hintAr:
      'إذا تُرك فارغاً يُحتسب تلقائياً كأول يوم من شهر بداية المطالبة، مثال 1/3/2024',
    type: 'date',
    placeholder: 'يوم/شهر/سنة',
  },
  arrears_from_month: {
    name: 'arrears_from_month',
    width: 'short',
    span: 4,
    labelAr: 'من شهر',
    type: 'select',
    required: true,
    options: monthOptions,
  },
  arrears_to_month: {
    name: 'arrears_to_month',
    width: 'short',
    span: 4,
    labelAr: 'إلى شهر',
    type: 'select',
    required: true,
    options: monthOptions,
  },
  arrears_year: {
    name: 'arrears_year',
    width: 'short',
    span: 4,
    labelAr: 'السنة',
    type: 'select',
    required: true,
    options: yearOptions,
  },
  include_eviction_request: {
    name: 'include_eviction_request',
    labelAr: 'هل تتضمن الصحيفة طلب الإخلاء؟',
    type: 'boolean',
  },
  include_penalty_clause: {
    name: 'include_penalty_clause',
    labelAr: 'هل تتضمن الصحيفة طلب الشرط الجزائي؟',
    hintAr:
      'يُطالَب بمبلغ مساوٍ لإجمالي الأجرة المتأخرة إعمالاً للبند السادس من العقد.',
    type: 'boolean',
  },
}

/**
 * One person, as a pleading names them:
 * «فلان الفلاني – كويتي الجنسية – بطاقة مدنية رقم (000000000000)»
 * Parts the client left empty simply drop out rather than leaving a dangling
 * dash, which matters for the legacy rows that carry no structured data.
 */
function personLine(name: string, civilId: string, nationality: string): string {
  return [
    name.trim(),
    nationality ? `${nationalityLabel(nationality)} الجنسية` : '',
    civilId ? `بطاقة مدنية رقم (${civilId})` : '',
  ]
    .filter(Boolean)
    .join(' – ')
}

/** The اسم الطالب block exactly as it is written into the .docx. */
export function plaintiffLine(values: EvictionValues): string {
  switch (values.plaintiff_type) {
    case 'natural':
      return personLine(
        values.plaintiff_full_name,
        values.plaintiff_civil_id,
        values.plaintiff_nationality,
      )

    case 'heirs': {
      const heirs = values.plaintiff_heirs
        .filter((h) => h.name.trim())
        .map((h, i) => `${i + 1}- ${personLine(h.name, h.civil_id, h.nationality)}`)
        .join('\n')
      const head = `ورثة المرحوم/ ${values.plaintiff_deceased_name.trim()}، وهم كل من:`
      return heirs ? `${head}\n${heirs}` : head
    }

    case 'company':
      return [
        values.plaintiff_company_name.trim(),
        COMPANY_FORM_LABEL.get(values.plaintiff_company_form) ?? '',
        values.plaintiff_company_register
          ? `سجل تجاري رقم (${values.plaintiff_company_register})`
          : '',
        values.plaintiff_company_civil_no
          ? `رقم الجهة المدني (${values.plaintiff_company_civil_no})`
          : '',
      ]
        .filter(Boolean)
        .join(' – ')

    case 'licence': {
      const establishment = [
        values.plaintiff_establishment_name.trim(),
        values.plaintiff_licence_register
          ? `سجل تجاري رقم (${values.plaintiff_licence_register})`
          : '',
        values.plaintiff_licence_civil_no
          ? `رقم الجهة المدني (${values.plaintiff_licence_civil_no})`
          : '',
      ]
        .filter(Boolean)
        .join(' – ')
      const owner = personLine(
        values.plaintiff_owner_name,
        values.plaintiff_owner_civil_id,
        values.plaintiff_owner_nationality,
      )
      return owner ? `${establishment}، ويملكها السيد/ ${owner}` : establishment
    }

    default:
      // submitted before the party types existed: the client typed the block
      return values.plaintiff_name
  }
}

function computeMonths(from: number, to: number) {
  return to - from + 1
}

function derive(
  values: EvictionValues,
  overrides: Record<string, string> = {},
): Placeholders {
  const months = computeMonths(values.arrears_from_month, values.arrears_to_month)
  const total = values.monthly_rent * months

  const premises = values.premises_same_as_defendant
    ? values.defendant_address
    : values.premises_address

  // the weekday is derived from the date itself rather than typed
  const leaseDay = weekdayAr(values.lease_date)
  const leasePhrase = leaseDay
    ? `مؤرخ في ${leaseDay} الموافق ${values.lease_date}`
    : `مؤرخ في ${values.lease_date}`

  const monthsList = Array.from(
    { length: months },
    (_, i) => values.arrears_from_month + i,
  ).join(' و ')

  const nonpayment =
    values.nonpayment_start_date ||
    `1/${values.arrears_from_month}/${values.arrears_year}`

  // مقابل الانتفاع runs from the first day of the month after the last unpaid one
  const benefitMonth = values.arrears_to_month === 12 ? 1 : values.arrears_to_month + 1
  const benefitYear =
    values.arrears_to_month === 12 ? values.arrears_year + 1 : values.arrears_year

  // which demands appear, and therefore how they are numbered
  const demands: string[] = []
  if (values.include_eviction_request) demands.push('eviction')
  demands.push('arrears')
  if (values.include_penalty_clause) demands.push('penalty')
  demands.push('costs')
  const ordinalOf = (key: string) => {
    const index = demands.indexOf(key)
    return index === -1 ? '' : ORDINALS[index]
  }

  const computed: Placeholders = {
    plaintiff_name: plaintiffLine(values),
    defendant_name: values.defendant_name,
    defendant_address: values.defendant_address,
    premises_address: premises,
    premises_lead: values.premises_lead,
    lease_date: values.lease_date,
    lease_date_phrase: leasePhrase,
    property_use: values.property_use,
    monthly_rent: formatAmount(values.monthly_rent),
    monthly_rent_words: amountToArabicWords(values.monthly_rent),
    nonpayment_start_date: nonpayment,
    arrears_from_month: String(values.arrears_from_month),
    arrears_to_month: String(values.arrears_to_month),
    arrears_year: String(values.arrears_year),
    arrears_months_count: String(months),
    arrears_months_list: monthsList,
    arrears_total: formatAmount(total),
    arrears_total_words: amountToArabicWords(total),
    benefit_start_date: `1-${benefitMonth}-${benefitYear}`,
    penalty_amount: formatAmount(total),
    penalty_amount_words: amountToArabicWords(total),
    ordinal_eviction: ordinalOf('eviction'),
    ordinal_arrears: ordinalOf('arrears'),
    ordinal_penalty: ordinalOf('penalty'),
    ordinal_costs: ordinalOf('costs'),
    include_eviction_request: values.include_eviction_request,
    include_penalty_clause: values.include_penalty_clause,
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== null && value !== '' && key in computed) {
      computed[key] = value
    }
  }

  return computed
}

export const evictionTemplate: TemplateDef<EvictionValues> = {
  key: 'eviction-petition',
  nameAr: 'صحيفة دعوى إخلاء ومطالبة بمتأخر أجرة',
  descriptionAr:
    'دعوى إخلاء للعين المؤجرة لعدم سداد الأجرة، مع المطالبة بالمتأخر وما يستجد حتى تمام الإخلاء.',
  filenamePrefix: 'sahifat-da3wa-ikhla',
  schema: evictionSchema,
  derive,
  overridable: [
    { name: 'plaintiff_name', labelAr: 'اسم الطالب كما يظهر في الصحيفة' },
    { name: 'lease_date_phrase', labelAr: 'عبارة تاريخ العقد' },
    { name: 'nonpayment_start_date', labelAr: 'تاريخ بدء الامتناع' },
    { name: 'arrears_months_list', labelAr: 'قائمة الأشهر المتأخرة' },
    { name: 'arrears_total', labelAr: 'إجمالي المتأخر (رقماً)' },
    { name: 'arrears_total_words', labelAr: 'إجمالي المتأخر (كتابةً)' },
    { name: 'monthly_rent_words', labelAr: 'الأجرة الشهرية (كتابةً)' },
    { name: 'benefit_start_date', labelAr: 'تاريخ بدء مقابل الانتفاع' },
    { name: 'penalty_amount', labelAr: 'مبلغ الشرط الجزائي (رقماً)' },
    { name: 'penalty_amount_words', labelAr: 'مبلغ الشرط الجزائي (كتابةً)' },
  ],
  summary: (v) =>
    `${v.defendant_name || '—'} · ${formatAmount(v.monthly_rent)} د.ك شهرياً · الأشهر ${
      v.arrears_from_month
    }–${v.arrears_to_month}/${v.arrears_year}`,
  sections: [
    {
      key: 'parties',
      titleAr: 'أطراف الدعوى',
      fields: [
        fields.plaintiff_type,
        fields.plaintiff_full_name,
        fields.plaintiff_civil_id,
        fields.plaintiff_nationality,
        fields.plaintiff_deceased_name,
        fields.plaintiff_heirs,
        fields.plaintiff_company_name,
        fields.plaintiff_company_form,
        fields.plaintiff_company_register,
        fields.plaintiff_company_civil_no,
        fields.plaintiff_establishment_name,
        fields.plaintiff_owner_name,
        fields.plaintiff_owner_civil_id,
        fields.plaintiff_owner_nationality,
        fields.plaintiff_licence_register,
        fields.plaintiff_licence_civil_no,
        fields.defendant_name,
        fields.defendant_address,
      ],
    },
    {
      key: 'premises',
      titleAr: 'العين المؤجرة وعقد الإيجار',
      fields: [
        fields.premises_lead,
        fields.premises_same_as_defendant,
        fields.premises_address,
        fields.lease_date,
        fields.property_use,
        fields.monthly_rent,
      ],
    },
    {
      key: 'arrears',
      titleAr: 'الأجرة المتأخرة',
      fields: [
        fields.nonpayment_start_date,
        fields.arrears_from_month,
        fields.arrears_to_month,
        fields.arrears_year,
      ],
    },
    {
      key: 'demands',
      titleAr: 'الطلبات',
      fields: [fields.include_eviction_request, fields.include_penalty_clause],
    },
  ],
}
