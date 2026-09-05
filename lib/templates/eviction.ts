import { z } from 'zod'
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

export const evictionSchema = z
  .object({
    plaintiff_name: z.string().trim().min(3, 'اسم الطالب مطلوب').max(4000),
    defendant_name: z.string().trim().min(3, 'اسم المعلن إليه مطلوب').max(1000),
    defendant_address: z.string().trim().min(3, 'عنوان المعلن إليه مطلوب').max(2000),
    premises_same_as_defendant: z.boolean(),
    premises_address: z.string().trim().max(2000),
    premises_lead: z.string().trim().min(2).max(60),
    lease_day_name: z.string().trim().max(20),
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
  plaintiff_name: '',
  defendant_name: '',
  defendant_address: '',
  premises_same_as_defendant: true,
  premises_address: '',
  premises_lead: 'الشقة الكائنة في',
  lease_day_name: '',
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
  plaintiff_name: {
    name: 'plaintiff_name',
    labelAr: 'اسم الطالب (المدعي)',
    hintAr:
      'يُكتب كما يظهر في الصحيفة، مع بيان الجنسية والرقم المدني لكل طالب. اكتب كل طالب في سطر مستقل.',
    type: 'textarea',
    rows: 6,
    required: true,
    placeholder:
      'ورثة فلان الفلاني، وهم كل من:\n1-السيد/ ... – كويتي الجنسية – ب.م. (000000000000)',
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
  lease_day_name: {
    name: 'lease_day_name',
    labelAr: 'يوم تحرير عقد الإيجار (اختياري)',
    hintAr: 'مثال: الأحد. اتركه فارغاً إذا لم يكن معروفاً.',
    type: 'text',
  },
  lease_date: {
    name: 'lease_date',
    labelAr: 'تاريخ عقد الإيجار',
    hintAr: 'بصيغة يوم/شهر/سنة، مثال 19/5/2019',
    type: 'text',
    required: true,
    placeholder: '19/5/2019',
  },
  property_use: {
    name: 'property_use',
    labelAr: 'غرض استعمال العين المؤجرة',
    type: 'text',
    required: true,
    placeholder: 'سكن عائلي',
  },
  monthly_rent: {
    name: 'monthly_rent',
    labelAr: 'قيمة الأجرة الشهرية (د.ك)',
    hintAr: 'الرقم فقط. يُكتب المبلغ بالحروف تلقائياً في الصحيفة.',
    type: 'number',
    required: true,
    placeholder: '470',
  },
  nonpayment_start_date: {
    name: 'nonpayment_start_date',
    labelAr: 'تاريخ بدء الامتناع عن سداد الأجرة (اختياري)',
    hintAr:
      'إذا تُرك فارغاً يُحتسب تلقائياً كأول يوم من شهر بداية المطالبة، مثال 1/3/2024',
    type: 'text',
    placeholder: '1/3/2024',
  },
  arrears_from_month: {
    name: 'arrears_from_month',
    labelAr: 'من شهر',
    type: 'select',
    required: true,
    options: monthOptions,
  },
  arrears_to_month: {
    name: 'arrears_to_month',
    labelAr: 'إلى شهر',
    type: 'select',
    required: true,
    options: monthOptions,
  },
  arrears_year: {
    name: 'arrears_year',
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

  const leasePhrase = values.lease_day_name
    ? `مؤرخ في ${values.lease_day_name} الموافق ${values.lease_date}`
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
    plaintiff_name: values.plaintiff_name,
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
      fields: [fields.plaintiff_name, fields.defendant_name, fields.defendant_address],
    },
    {
      key: 'premises',
      titleAr: 'العين المؤجرة وعقد الإيجار',
      fields: [
        fields.premises_lead,
        fields.premises_same_as_defendant,
        fields.premises_address,
        fields.lease_day_name,
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
