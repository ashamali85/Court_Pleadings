/**
 * The questions the office answers to produce a عقد محاماة (جناية أو جنحة).
 *
 * §3 of the stack file lists them in the order the lawyer works through them,
 * and that is the order of the sections here. They are `FieldDef`s, the same
 * ones the pleadings are built from, so the contract gets the app's dropdowns,
 * its flag-picker, its date picker, its error styling and its content screen
 * without any of that being written a second time.
 *
 * Why this is not `party.ts`: that file is the shared definition of a party to
 * a pleading — صفة، شركة، ورثة، جهة حكومية — and CLAUDE.md requires every
 * صحيفة دعوى to use it unchanged. A contract has no صفة and no heirs; it has a
 * person with a phone number and an email, and §4.2 fixes exactly which eight
 * questions those are. Forcing the two together would corrupt both.
 *
 * One section per answer that can hide others, never a section that can empty
 * itself: `mode` sits with the accused it reveals, and each yes/no question
 * sits with what it asks for. A section whose every field is hidden would
 * otherwise render as a card with nothing in it.
 */
import { GENDER_OPTIONS } from '@/lib/templates/party'
import { NATIONALITIES } from '@/lib/nationalities'
import type { FieldDef, SectionDef } from '@/lib/templates/types'

export const CONTRACT_FORM_KEY = 'criminal-defense-contract'

/** §4.2: "Honorific: السيد / السيدة / الشيخ / الدكتور …" */
const TITLE_OPTIONS = [
  { value: 'السيد', labelAr: 'السيد' },
  { value: 'السيدة', labelAr: 'السيدة' },
  { value: 'الشيخ', labelAr: 'الشيخ' },
  { value: 'الشيخة', labelAr: 'الشيخة' },
  { value: 'الدكتور', labelAr: 'الدكتور' },
  { value: 'الدكتورة', labelAr: 'الدكتورة' },
  { value: 'المحامي', labelAr: 'المحامي' },
  { value: 'المحامية', labelAr: 'المحامية' },
]

const nationalityOptions = NATIONALITIES.map((n) => ({
  value: n.value,
  labelAr: n.labelAr,
}))

/**
 * The eight questions of §4.2, under one prefix.
 *
 * `showWhen` is passed through so the guarantor's eight can be revealed by the
 * one checkbox above them; the client's eight are always asked.
 */
function personFields(
  prefix: string,
  who: string,
  showWhen?: FieldDef['showWhen'],
): FieldDef[] {
  const n = (key: string) => `${prefix}_${key}`
  const gate = showWhen ? { showWhen } : {}
  return [
    {
      ...gate,
      name: n('title'),
      labelAr: 'اللقب',
      type: 'select',
      required: true,
      width: 'sel',
      span: 3,
      options: TITLE_OPTIONS,
    },
    {
      ...gate,
      name: n('name'),
      labelAr: `اسم ${who}`,
      hintAr: 'الاسم الكامل كما هو في البطاقة المدنية.',
      type: 'text',
      required: true,
      width: 'name',
      span: 9,
    },
    {
      ...gate,
      name: n('gender'),
      labelAr: 'الجنس',
      hintAr: 'تُصاغ جمل العقد بحسبه (ويقيم/وتقيم، هاتفه/هاتفها).',
      type: 'select',
      required: true,
      width: 'sel',
      span: 3,
      options: GENDER_OPTIONS,
    },
    {
      ...gate,
      name: n('nationality'),
      labelAr: 'الجنسية',
      type: 'select',
      required: true,
      searchable: true,
      optionIcon: 'flag',
      placeholder: 'اكتب للبحث عن الجنسية',
      width: 'sel',
      span: 5,
      options: nationalityOptions,
    },
    {
      ...gate,
      name: n('civil_id'),
      labelAr: 'الرقم المدني',
      hintAr: 'اثنا عشر رقماً كما تظهر على البطاقة المدنية، بدون فواصل.',
      type: 'text',
      required: true,
      latinDigits: true,
      width: 'num',
      span: 4,
    },
    {
      ...gate,
      name: n('phone'),
      labelAr: 'رقم الهاتف',
      hintAr: 'هذا الرقم هو أساس التخاطب في العقد، فتأكد من صحته.',
      type: 'text',
      required: true,
      latinDigits: true,
      width: 'num',
      span: 4,
    },
    {
      ...gate,
      name: n('email'),
      labelAr: 'البريد الالكتروني',
      type: 'text',
      required: true,
      width: 'reg',
      span: 8,
    },
    {
      ...gate,
      name: n('address'),
      labelAr: 'العنوان',
      placeholder: 'الجابرية، قطعة 1، شارع 5، منزل 10',
      type: 'text',
      required: true,
    },
  ]
}

const accusedGate: FieldDef['showWhen'] = { field: 'mode', equals: ['third_party'] }
const guarantorGate: FieldDef['showWhen'] = { field: 'has_guarantor', equals: ['true'] }

export const contractSections: SectionDef[] = [
  {
    key: 'contract',
    titleAr: 'تاريخ العقد',
    fields: [
      {
        name: 'date',
        labelAr: 'تاريخ العقد',
        hintAr: 'يُكتب في العقد بالعربية، مثل «22 أكتوبر 2026».',
        type: 'date',
        required: true,
        width: 'date',
        span: 4,
      },
    ],
  },
  {
    key: 'client',
    titleAr: 'بيانات المتعاقد (الطرف الثاني)',
    fields: personFields('client', 'المتعاقد'),
  },
  {
    key: 'case',
    titleAr: 'بيانات القضية',
    fields: [
      {
        name: 'case_no',
        labelAr: 'رقم القضية',
        placeholder: '123/2026 جنح حولي',
        hintAr: 'كما هو مقيد، مع الجهة: جنح أو جنايات والمحافظة.',
        type: 'text',
        required: true,
        width: 'phrase',
        span: 6,
      },
      {
        name: 'case_desc',
        labelAr: 'وصف القضية',
        placeholder: 'إساءة استعمال الهاتف',
        hintAr: 'وصف موجز للتهمة؛ يُكتب في العقد بين قوسين.',
        type: 'text',
        required: true,
        width: 'phrase',
        span: 6,
      },
    ],
  },
  {
    key: 'accused',
    titleAr: 'صفة التعاقد وبيانات المتهم',
    fields: [
      {
        name: 'mode',
        labelAr: 'من يتعاقد؟',
        hintAr:
          'إذا تعاقد شخص آخر لمصلحة المتهم تغيّرت بنود العقد: تُضاف التزامات المتعاقد لمصلحة المتهم، ويُسمى المتهم في التمهيد.',
        type: 'select',
        required: true,
        width: 'phrase',
        options: [
          { value: 'self', labelAr: 'المتهم يتعاقد بنفسه' },
          { value: 'third_party', labelAr: 'شخص آخر يتعاقد لمصلحة المتهم' },
        ],
      },
      {
        showWhen: accusedGate,
        name: 'accused_title',
        labelAr: 'لقب المتهم',
        type: 'select',
        required: true,
        width: 'sel',
        span: 3,
        options: TITLE_OPTIONS,
      },
      {
        showWhen: accusedGate,
        name: 'accused_name',
        labelAr: 'اسم المتهم',
        hintAr: 'الاسم الكامل.',
        type: 'text',
        required: true,
        width: 'name',
        span: 9,
      },
      {
        showWhen: accusedGate,
        name: 'accused_gender',
        labelAr: 'جنس المتهم',
        type: 'select',
        required: true,
        width: 'sel',
        span: 3,
        options: GENDER_OPTIONS,
      },
      {
        showWhen: accusedGate,
        name: 'accused_nationality',
        labelAr: 'جنسية المتهم',
        type: 'select',
        required: true,
        searchable: true,
        optionIcon: 'flag',
        placeholder: 'اكتب للبحث عن الجنسية',
        width: 'sel',
        span: 5,
        options: nationalityOptions,
      },
      {
        showWhen: accusedGate,
        name: 'accused_civil_id',
        labelAr: 'الرقم المدني للمتهم',
        type: 'text',
        required: true,
        latinDigits: true,
        width: 'num',
        span: 4,
      },
      {
        showWhen: accusedGate,
        name: 'accused_relation',
        labelAr: 'صلة القرابة بالمتعاقد',
        placeholder: 'ابنها',
        hintAr: 'تُكتب من جهة المتعاقد: ابنها، أخوه، زوجها، موكله.',
        type: 'text',
        required: true,
        width: 'short',
        span: 4,
      },
    ],
  },
  {
    key: 'fees',
    titleAr: 'الأتعاب وطريقة السداد',
    fields: [
      {
        name: 'fees_total',
        labelAr: 'إجمالي الأتعاب (د.ك)',
        hintAr:
          'دينار كويتي، بالأرقام الصحيحة بدون فلوس؛ يُكتب في العقد بالأرقام والحروف.',
        type: 'number',
        required: true,
        latinDigits: true,
        width: 'money',
        span: 4,
      },
      {
        name: 'fees_mode',
        labelAr: 'طريقة السداد',
        type: 'select',
        required: true,
        width: 'phrase',
        span: 8,
        options: [
          { value: 'full', labelAr: 'كاملة فور التوقيع' },
          { value: 'two', labelAr: 'على دفعتين' },
          { value: 'other', labelAr: 'طريقة أخرى' },
        ],
      },
      {
        showWhen: { field: 'fees_mode', equals: ['two'] },
        name: 'fees_first',
        labelAr: 'الدفعة الأولى (د.ك)',
        hintAr: 'تُسدد فور التوقيع. مجموع الدفعتين يجب أن يساوي الإجمالي.',
        type: 'number',
        required: true,
        latinDigits: true,
        width: 'money',
        span: 4,
      },
      {
        showWhen: { field: 'fees_mode', equals: ['two'] },
        name: 'fees_second',
        labelAr: 'الدفعة الثانية (د.ك)',
        type: 'number',
        required: true,
        latinDigits: true,
        width: 'money',
        span: 4,
      },
      {
        showWhen: { field: 'fees_mode', equals: ['two'] },
        name: 'fees_second_due',
        labelAr: 'موعد استحقاق الدفعة الثانية',
        placeholder: 'بعد مرور ستة أشهر ميلادية من تاريخ التوقيع على هذا العقد',
        hintAr: 'يُكتب في العقد بعد كلمة «يستحق»، فابدأ العبارة بما يناسبها.',
        type: 'text',
        required: true,
      },
      {
        showWhen: { field: 'fees_mode', equals: ['other'] },
        name: 'fees_other_text',
        labelAr: 'بيان طريقة السداد',
        placeholder: 'تسدد على ثلاث دفعات شهرية متساوية تبدأ من تاريخ التوقيع.',
        hintAr: 'عبارة عربية كاملة تنتهي بنقطة؛ تُكتب في العقد كما هي.',
        type: 'textarea',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    key: 'extras',
    titleAr: 'أعمال إضافية',
    fields: [
      {
        name: 'has_additional_work',
        labelAr: 'هناك أعمال إضافية علاوة على القضية',
        type: 'boolean',
      },
      {
        showWhen: { field: 'has_additional_work', equals: ['true'] },
        name: 'additional_work',
        labelAr: 'وصف الأعمال الإضافية',
        placeholder: 'التظلم من أمر الحبس الاحتياطي.',
        hintAr: 'عبارة عربية كاملة تنتهي بنقطة؛ تُضاف إلى بند نطاق التعاقد كما هي.',
        type: 'textarea',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    key: 'guarantor',
    titleAr: 'الكفيل المتضامن (الطرف الثالث)',
    fields: [
      {
        name: 'has_guarantor',
        labelAr: 'هناك كفيل متضامن',
        hintAr:
          'إضافة الكفيل تضيف طرفاً ثالثاً للعقد وبند الكفالة التضامنية، وتجعل العقد ثلاث نسخ أصلية بثلاث خانات توقيع.',
        type: 'boolean',
      },
      ...personFields('guarantor', 'الكفيل', guarantorGate),
    ],
  },
]

/** what a blank form starts with: nothing typed, and no amount showing 0 */
export const contractDefaults: Record<string, unknown> = {
  date: '',
  case_no: '',
  case_desc: '',
  mode: '',
  fees_mode: '',
  fees_total: '',
  fees_first: '',
  fees_second: '',
  fees_second_due: '',
  fees_other_text: '',
  has_additional_work: false,
  additional_work: '',
  has_guarantor: false,
  ...Object.fromEntries(
    ['client', 'accused', 'guarantor'].flatMap((prefix) =>
      [
        'title',
        'name',
        'gender',
        'nationality',
        'civil_id',
        'phone',
        'email',
        'address',
      ].map((key) => [`${prefix}_${key}`, '']),
    ),
  ),
}
