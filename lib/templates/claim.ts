/**
 * صحيفة دعوى مطالبة مالية — the second case type the office offers.
 *
 * This file is only the form and the plumbing: the questions the client is
 * asked, the rules that validate the answers, and the placeholders the
 * documents are filled from. Every word of Arabic that ends up in a document
 * is composed in lib/claim/, which is tested on its own against the office's
 * approved output. Nothing here writes a sentence.
 *
 * The question order follows the lawyer's own list in
 * docs/business-rules/template-notes.md §«قائمة الأسئلة».
 */
import { z } from 'zod'
import type { ClaimCase } from '@/lib/claim/case'
import { RELATIONSHIPS } from '@/lib/claim/case'
import {
  composeDemand,
  composeExhibits,
  composeLawsuit,
  composeOrder,
  partyName,
} from '@/lib/claim/compose'
import { courtLevel, documentsFor } from '@/lib/claim/court'
import { CLAIM_DOCUMENT_LABEL } from '@/lib/claim/grammar'
import {
  amountsReconcile,
  INSTRUMENT_KINDS,
  INSTRUMENT_OPTIONS,
  type Instrument,
  type InstrumentKind,
} from '@/lib/claim/instruments'
import { formatMoney } from '@/lib/claim/money'
import {
  blankPartyRow,
  DEFENDANT,
  PARTY_SIDES,
  PLAINTIFF,
  partySection,
  partyShape,
  readParty,
  validateParty,
} from '@/lib/templates/party'
import type { FieldDef, Placeholders, TemplateDef } from '@/lib/templates/types'

const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/

/* --- schema ---------------------------------------------------------- */

/**
 * A checkbox inside a repeatable row travels as the string 'true' or '', and
 * `z.coerce.boolean()` would read the string 'false' as true. This reads only
 * the one value the form actually writes.
 */
const rowBoolean = z.preprocess((v) => v === true || v === 'true', z.boolean())

const instrumentSchema = z.object({
  // an empty row posts '', which must ask for a choice rather than quietly
  // becoming a cheque
  kind: z.enum(INSTRUMENT_KINDS, { error: 'اختر نوع السند' }),
  number: z.string().trim().max(120).default(''),
  date: z.string().trim().max(20).default(''),
  bank: z.string().trim().max(200).default(''),
  returned: rowBoolean,
  stamped: rowBoolean,
  text: z.string().trim().max(1000).default(''),
  amount: z.coerce.number().min(0).max(100_000_000).default(0),
})

export const claimSchema = z
  .object({
    /* the two parties, exactly as every other pleading type asks them */
    plaintiff_type: partyShape.type,
    plaintiff_name: partyShape.name,
    plaintiff_full_name: partyShape.full_name,
    plaintiff_gender: partyShape.gender,
    plaintiff_civil_id: partyShape.civil_id,
    plaintiff_nationality: partyShape.nationality,
    plaintiff_parties: partyShape.parties,
    plaintiff_deceased_name: partyShape.deceased_name,
    plaintiff_heirs: partyShape.heirs,
    plaintiff_company_name: partyShape.company_name,
    plaintiff_company_form: partyShape.company_form,
    plaintiff_company_register: partyShape.company_register,
    plaintiff_company_civil_no: partyShape.company_civil_no,
    plaintiff_establishment_name: partyShape.establishment_name,
    plaintiff_owner_name: partyShape.owner_name,
    plaintiff_owner_civil_id: partyShape.owner_civil_id,
    plaintiff_owner_nationality: partyShape.owner_nationality,
    plaintiff_licence_register: partyShape.licence_register,
    plaintiff_licence_civil_no: partyShape.licence_civil_no,

    defendant_type: partyShape.type,
    defendant_name: partyShape.name,
    defendant_full_name: partyShape.full_name,
    defendant_gender: partyShape.gender,
    defendant_civil_id: partyShape.civil_id,
    defendant_nationality: partyShape.nationality,
    defendant_parties: partyShape.parties,
    defendant_deceased_name: partyShape.deceased_name,
    defendant_heirs: partyShape.heirs,
    defendant_company_name: partyShape.company_name,
    defendant_company_form: partyShape.company_form,
    defendant_company_register: partyShape.company_register,
    defendant_company_civil_no: partyShape.company_civil_no,
    defendant_establishment_name: partyShape.establishment_name,
    defendant_owner_name: partyShape.owner_name,
    defendant_owner_civil_id: partyShape.owner_civil_id,
    defendant_owner_nationality: partyShape.owner_nationality,
    defendant_licence_register: partyShape.licence_register,
    defendant_licence_civil_no: partyShape.licence_civil_no,
    defendant_government_name: partyShape.government_name,

    defendant_address: z.string().trim().min(3, 'عنوان المعلن إليه مطلوب').max(2000),

    amount: z.coerce
      .number({ error: 'مبلغ المطالبة مطلوب' })
      .positive('يجب أن يكون المبلغ أكبر من صفر')
      .max(100_000_000),
    relationship: z.string().trim().min(2).max(40),
    relationship_other: z.string().trim().max(300).default(''),

    instruments: z.array(instrumentSchema).max(30).default([]),

    legal_interest: z.boolean(),
    has_contract: z.boolean(),

    /* the office's own answers — filled by the lawyer at review */
    court_name: z.string().trim().max(120).default(''),
    demand_posted_on: z.string().trim().max(20).default(''),
    order_number: z.string().trim().max(40).default(''),
    order_year: z.string().trim().max(10).default(''),
    order_refused_on: z.string().trim().max(20).default(''),
    claimant_address: z.string().trim().max(2000).default(''),
    claimant_email: z.string().trim().max(200).default(''),
  })
  .superRefine((v, ctx) => {
    const need = (ok: boolean, path: (string | number)[], message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path, message })
    }

    // the two parties follow the shared rules, like every pleading type
    for (const side of PARTY_SIDES) {
      const party = readParty(v, side.prefix)
      need(
        party.type === undefined || side.types.includes(party.type),
        [`${side.prefix}_type`],
        `صفة ${side.labelAr} غير مقبولة`,
      )
      validateParty(party, side.prefix, need, side.labelAr)
    }

    if (v.relationship === 'other') {
      need(
        v.relationship_other.trim().length >= 2,
        ['relationship_other'],
        'اكتب طبيعة العلاقة',
      )
    }

    need(v.instruments.length > 0, ['instruments'], 'أضف سند دين واحداً على الأقل')

    v.instruments.forEach((instrument, i) => {
      const at = (key: string) => ['instruments', i, key]
      if (instrument.kind === 'other') {
        need(instrument.text.trim().length >= 3, at('text'), 'اكتب وصف السند')
        return
      }
      if (instrument.kind !== 'private_acknowledgement') {
        need(instrument.number.trim().length >= 1, at('number'), 'رقم السند مطلوب')
      }
      need(DATE_RE.test(instrument.date), at('date'), 'صيغة التاريخ يوم/شهر/سنة')
      if (instrument.kind === 'cheque') {
        need(instrument.bank.trim().length >= 2, at('bank'), 'اسم البنك مطلوب')
      }
    })

    for (const [key, label] of [
      ['demand_posted_on', 'تاريخ إرسال التكليف'],
      ['order_refused_on', 'تاريخ رفض أمر الأداء'],
    ] as const) {
      const value = v[key]
      if (value) need(DATE_RE.test(value), [key], `${label}: الصيغة يوم/شهر/سنة`)
    }
  })

export type ClaimValues = z.infer<typeof claimSchema>

export const claimDefaults: ClaimValues = {
  // a new form starts on the commonest shape, as the eviction petition does;
  // leaving it unset would show the legacy free-text field on a blank form
  plaintiff_type: 'natural',
  plaintiff_name: '',
  plaintiff_full_name: '',
  plaintiff_gender: '',
  plaintiff_civil_id: '',
  plaintiff_nationality: 'KW',
  plaintiff_parties: [blankPartyRow(), blankPartyRow()],
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

  defendant_type: 'natural',
  defendant_name: '',
  defendant_full_name: '',
  defendant_gender: '',
  defendant_civil_id: '',
  defendant_nationality: 'KW',
  defendant_parties: [blankPartyRow(), blankPartyRow()],
  defendant_deceased_name: '',
  defendant_heirs: [{ name: '', civil_id: '', nationality: 'KW' }],
  defendant_company_name: '',
  defendant_company_form: '',
  defendant_company_register: '',
  defendant_company_civil_no: '',
  defendant_establishment_name: '',
  defendant_owner_name: '',
  defendant_owner_civil_id: '',
  defendant_owner_nationality: 'KW',
  defendant_licence_register: '',
  defendant_licence_civil_no: '',
  defendant_government_name: '',
  defendant_address: '',

  amount: 0,
  relationship: 'commercial',
  relationship_other: '',
  instruments: [
    {
      kind: 'cheque',
      number: '',
      date: '',
      bank: '',
      returned: false,
      stamped: false,
      text: '',
      amount: 0,
    },
  ],
  legal_interest: true,
  has_contract: false,

  court_name: '',
  demand_posted_on: '',
  order_number: '',
  order_year: String(new Date().getFullYear()),
  order_refused_on: '',
  claimant_address: '',
  claimant_email: '',
}

/* --- values -> the case the composer understands ---------------------- */

export function toCase(values: ClaimValues): ClaimCase {
  return {
    claimant: readParty(values, PLAINTIFF.prefix),
    respondent: readParty(values, DEFENDANT.prefix),
    respondentAddress: values.defendant_address,
    amount: values.amount,
    relationship: values.relationship,
    relationshipOther: values.relationship_other,
    instruments: values.instruments as Instrument[],
    legalInterest: values.legal_interest,
    hasContract: values.has_contract,
    courtName: values.court_name,
    demandPostedOn: values.demand_posted_on,
    orderNumber: values.order_number,
    orderYear: values.order_year,
    orderRefusedOn: values.order_refused_on,
    claimantAddress: values.claimant_address,
    claimantEmail: values.claimant_email,
  }
}

/* --- the form -------------------------------------------------------- */

const instrumentRowFields: FieldDef[] = [
  {
    name: 'kind',
    labelAr: 'نوع السند',
    type: 'select',
    width: 'sel',
    span: 6,
    required: true,
    options: INSTRUMENT_OPTIONS.map((o) => ({ value: o.value, labelAr: o.labelAr })),
  },
  {
    name: 'number',
    labelAr: 'الرقم',
    type: 'text',
    width: 'reg',
    span: 6,
    latinDigits: true,
    // الإقرار العرفي لا رقم له، و«أخرى» يكتبها العميل بنفسه
    showWhen: {
      field: 'kind',
      equals: INSTRUMENT_KINDS.filter(
        (k) => k !== 'private_acknowledgement' && k !== 'other',
      ) as unknown as string[],
    },
  },
  {
    name: 'date',
    labelAr: 'التاريخ',
    type: 'date',
    width: 'date',
    span: 6,
    showWhen: {
      field: 'kind',
      equals: INSTRUMENT_KINDS.filter((k) => k !== 'other') as unknown as string[],
    },
  },
  {
    name: 'bank',
    labelAr: 'البنك المسحوب عليه',
    type: 'text',
    width: 'name',
    span: 6,
    showWhen: { field: 'kind', equals: ['cheque'] },
  },
  {
    name: 'returned',
    labelAr: 'رُدّ الشيك من البنك',
    type: 'boolean',
    showWhen: { field: 'kind', equals: ['cheque'] },
  },
  {
    name: 'stamped',
    labelAr: 'مذيّل بختم أو توقيع المعلن إليه بما يفيد الاستلام',
    type: 'boolean',
    showWhen: { field: 'kind', equals: ['invoice', 'account_statement'] },
  },
  {
    name: 'text',
    labelAr: 'وصف السند',
    type: 'textarea',
    rows: 2,
    showWhen: { field: 'kind', equals: ['other'] },
  },
  {
    name: 'amount',
    labelAr: 'مبلغ هذا السند',
    hintAr:
      'يُملأ عند تعدد السندات؛ ويجب أن يكون مجموع السندات مساوياً لمبلغ المطالبة.',
    type: 'number',
    width: 'money',
    span: 6,
    latinDigits: true,
  },
]

const fields: Record<string, FieldDef> = {
  defendant_address: {
    name: 'defendant_address',
    labelAr: 'عنوان إعلان المعلن إليه',
    // a ministry is addressed by its own name, not as «المعلن إليه»
    labelWhen: [
      {
        field: 'defendant_type',
        equals: ['government'],
        labelAr: 'عنوان الجهة الحكومية',
      },
    ],
    hintAr: 'المنطقة، القطعة، الشارع، القسيمة، الدور. الرقم الآلي للعنوان لا يُذكر.',
    type: 'textarea',
    rows: 4,
    required: true,
  },
  amount: {
    name: 'amount',
    labelAr: 'مبلغ المطالبة (د.ك.)',
    hintAr:
      'يُكتب رقماً؛ يتولى النظام تفقيطه، ويحدد درجة المحكمة (5001 د.ك. فأكثر كلية).',
    type: 'number',
    width: 'money',
    span: 6,
    required: true,
    latinDigits: true,
  },
  relationship: {
    name: 'relationship',
    labelAr: 'طبيعة العلاقة',
    type: 'select',
    width: 'sel',
    span: 6,
    required: true,
    options: RELATIONSHIPS.map((r) => ({ value: r.value, labelAr: r.labelAr })),
  },
  relationship_other: {
    name: 'relationship_other',
    labelAr: 'اكتب طبيعة العلاقة',
    type: 'text',
    width: 'org',
    required: true,
    showWhen: { field: 'relationship', equals: ['other'] },
  },
  instruments: {
    name: 'instruments',
    labelAr: 'سندات الدين',
    hintAr:
      'سند لكل صف. وجود ورقة تجارية واحدة (شيك أو كمبيالة أو سند إذني) يعني أربعة مخرجات بدل اثنين.',
    type: 'rows',
    required: true,
    minRows: 1,
    rowLabelAr: 'سند',
    addLabelAr: 'إضافة سند',
    rowFields: instrumentRowFields,
  },
  legal_interest: {
    name: 'legal_interest',
    labelAr: 'المطالبة بالفوائد القانونية 7% من تاريخ الاستحقاق وحتى تمام الوفاء',
    type: 'boolean',
  },
  has_contract: {
    name: 'has_contract',
    labelAr: 'يوجد عقد مبرم بين الطرفين (يُدرج في حافظة المستندات)',
    type: 'boolean',
  },

  /* --- the office's own answers, hidden from the client ------------- */
  court_name: {
    name: 'court_name',
    labelAr: 'اسم المحكمة',
    hintAr: 'مثل: الرقعي. الدرجة (كلية/جزئية) تُحدد من المبلغ تلقائياً.',
    type: 'text',
    width: 'reg',
    span: 6,
    adminOnly: true,
  },
  demand_posted_on: {
    name: 'demand_posted_on',
    labelAr: 'تاريخ إرسال التكليف بالوفاء بالبريد المسجل',
    type: 'date',
    width: 'date',
    span: 6,
    adminOnly: true,
  },
  order_number: {
    name: 'order_number',
    labelAr: 'رقم أمر الأداء المرفوض',
    hintAr: 'يُترك فارغاً إن لم يصدر بعد.',
    type: 'text',
    width: 'reg',
    span: 4,
    latinDigits: true,
    adminOnly: true,
  },
  order_year: {
    name: 'order_year',
    labelAr: 'سنة أمر الأداء',
    type: 'text',
    width: 'short',
    span: 4,
    latinDigits: true,
    adminOnly: true,
  },
  order_refused_on: {
    name: 'order_refused_on',
    labelAr: 'تاريخ رفض أمر الأداء',
    type: 'date',
    width: 'date',
    span: 4,
    adminOnly: true,
  },
  claimant_address: {
    name: 'claimant_address',
    labelAr: 'عنوان الطالب (لأمر الأداء)',
    hintAr: 'الصحيفة تستخدم موطن المكتب المختار؛ أمر الأداء يحتاج عنوان الطالب نفسه.',
    type: 'textarea',
    rows: 3,
    adminOnly: true,
  },
  claimant_email: {
    name: 'claimant_email',
    labelAr: 'العنوان الإلكتروني في تطبيق هويتي',
    type: 'text',
    width: 'org',
    adminOnly: true,
  },
}

/* --- placeholders ----------------------------------------------------- */

function derive(
  values: ClaimValues,
  overrides: Record<string, string> = {},
): Placeholders {
  const claim = toCase(values)
  const lawsuit = composeLawsuit(claim)
  const demand = composeDemand(claim)
  const order = composeOrder(claim)
  const exhibits = composeExhibits(claim)
  const level = courtLevel(claim.amount)
  const produced = documentsFor(claim.instruments)

  const computed: Placeholders = {
    /* which documents this claim produces */
    documents: produced.map((d) => CLAIM_DOCUMENT_LABEL[d]).join('، '),
    include_demand: produced.includes('demand'),
    include_order: produced.includes('order'),

    court_level: level.courtAr,
    order_level: level.orderAr,

    /* صحيفة الدعوى */
    lawsuit_subject: lawsuit.subject,
    lawsuit_amount: lawsuit.amountFigures,
    lawsuit_claimant: lawsuit.claimant,
    lawsuit_respondent: lawsuit.respondent,
    lawsuit_address: lawsuit.address,
    lawsuit_agent: lawsuit.agent,
    lawsuit_announced: lawsuit.announced,
    lawsuit_body: lawsuit.body.join('\n\n'),
    lawsuit_article_166: lawsuit.includeArticle166,
    lawsuit_summons: lawsuit.summons,
    lawsuit_requests: lawsuit.requests.join('\n\n'),

    /* تكليف بالوفاء */
    demand_respondent: demand.respondent,
    demand_address: demand.address,
    demand_subject: demand.subject,
    demand_body: demand.body.join('\n\n'),
    demand_final: demand.final,
    demand_agent: demand.agent,

    /* طلب استصدار أمر أداء */
    order_judge: order.judge,
    order_applicant: order.applicant,
    order_applicant_label: order.applicantLabel,
    order_respondent: order.respondent,
    order_respondent_label: order.respondentLabel,
    order_address: order.address,
    order_body: order.body.join('\n\n'),
    order_prayer: order.prayer,
    order_agent: order.agent,
    decree_court: order.decree.court,
    decree_number: order.decree.number,
    decree_we_are: order.decree.weAre,
    decree_recital: order.decree.recital,
    decree_order: order.decree.order,
    decree_signature: order.decree.signature,

    /* حافظة المستندات */
    exhibits_from: exhibits.from,
    exhibits_from_label: exhibits.fromLabel,
    exhibits_to: exhibits.to,
    exhibits_to_label: exhibits.toLabel,
    exhibits_rows: exhibits.rows
      .map(
        (row, i) => `${i + 1} | ${row.date} | ${row.pages ?? ''} | ${row.description}`,
      )
      .join('\n'),
    exhibits_total: exhibits.total,
    exhibits_signature: exhibits.signature,
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== null && value !== '' && key in computed) {
      computed[key] = value
    }
  }

  return computed
}

/* --- the template ----------------------------------------------------- */

export const claimTemplate: TemplateDef<ClaimValues> = {
  key: 'financial-claim',
  nameAr: 'صحيفة دعوى مطالبة مالية',
  descriptionAr:
    'مطالبة بدين ثابت بالكتابة. سند الدين يحدد المخرجات: الورقة التجارية (شيك أو كمبيالة أو سند إذني) تنتج أربعة مستندات — صحيفة دعوى، تكليف بالوفاء، طلب أمر أداء، حافظة مستندات — وغيرها ينتج مستندين.',
  filenamePrefix: 'mutalaba-maliya',
  // the exhibit list needs its own kinds (سند الدين، هوية المعلن إليه، العقد);
  // until those exist the claim form does not offer the eviction ones
  acceptsAttachments: false,
  schema: claimSchema,
  defaults: claimDefaults as unknown as Record<string, unknown>,
  derive,
  overridable: [
    { name: 'lawsuit_claimant', labelAr: 'بيانات الطالب كما تظهر في الصحيفة' },
    { name: 'lawsuit_respondent', labelAr: 'بيانات المعلن إليه كما تظهر في الصحيفة' },
    { name: 'lawsuit_body', labelAr: 'متن الصحيفة' },
    { name: 'lawsuit_requests', labelAr: 'الطلبات' },
    { name: 'demand_body', labelAr: 'متن التكليف بالوفاء' },
    { name: 'demand_final', labelAr: 'فقرة «لذلك» في التكليف' },
    { name: 'order_body', labelAr: 'متن طلب أمر الأداء' },
    { name: 'order_prayer', labelAr: 'الالتماس في طلب أمر الأداء' },
    { name: 'decree_order', labelAr: 'صيغة الأمر' },
    { name: 'exhibits_rows', labelAr: 'صفوف حافظة المستندات' },
    { name: 'exhibits_total', labelAr: 'مجموع الحافظة' },
  ],
  summary: (v) => {
    const claim = toCase(v)
    const count = documentsFor(claim.instruments).length
    const reconcile = amountsReconcile(claim.instruments, claim.amount)
    const mismatch =
      claim.instruments.length > 1 && !reconcile.ok
        ? ` · ⚠ مجموع السندات ${formatMoney(reconcile.total)} لا يساوي المطالبة`
        : ''
    return `${partyName(toCase(v).respondent) || '—'} · ${formatMoney(v.amount)} د.ك. · ${
      claim.instruments.length
    } سند · ${count} مخرجات${mismatch}`
  },
  sections: [
    // the two party sections are the shared ones, identical to every other
    // pleading type; the service address is a fact about this case
    partySection(PLAINTIFF),
    partySection(DEFENDANT, [fields.defendant_address]),
    {
      key: 'debt',
      titleAr: 'الدين وسنده',
      fields: [
        fields.amount,
        fields.relationship,
        fields.relationship_other,
        fields.instruments,
      ],
    },
    {
      key: 'demands',
      titleAr: 'الطلبات والمستندات',
      fields: [fields.legal_interest, fields.has_contract],
    },
    {
      key: 'office',
      titleAr: 'بيانات المكتب (يملؤها المحامي)',
      fields: [
        fields.court_name,
        fields.demand_posted_on,
        fields.order_number,
        fields.order_year,
        fields.order_refused_on,
        fields.claimant_address,
        fields.claimant_email,
      ],
    },
  ],
}

export type { InstrumentKind }
