/**
 * What the office must fill in before a عقد محاماة can be produced.
 *
 * The engine checks nothing: a missing value becomes a yellow `[label]` in the
 * Word file, which is exactly what «نموذج فارغ» wants and exactly what a
 * signed-ready contract must never contain. §4.4 of the stack file is explicit
 * about who holds the rules — *"Validation the website should enforce (the
 * engine does NOT check these)"* — so they live here.
 *
 * Two schemas, deliberately:
 *
 *   `contractFormSchema` reads the flat values the form holds, so an error can
 *   be reported against the field that caused it and the section opens itself.
 *
 *   `contractInputSchema` is §9's own JSON Schema written in zod, and it reads
 *   the object `toContractInput` hands the engine. Nothing the lawyer types can
 *   fail it once the first schema has passed — which is the point: it fails
 *   only if `toContractInput` has a bug, and the route checks it on every
 *   request rather than trusting the transform.
 */
import { z } from 'zod'
import { longDateAr, toLatinDigits } from '@/lib/numerals'
import { isNationalityCode, nationalityAdjective } from '@/lib/nationalities'
import type {
  ContractInput,
  ContractPerson,
} from '@/lib/contracts/criminal-defense/engine'

export const CONTRACT_MODES = ['self', 'third_party'] as const
export const FEE_MODES = ['full', 'two', 'other'] as const

/** §4.4: the number-to-words function supports up to 999,999 */
export const MONEY_MAX = 999_999

const required = (what: string) => `${what} مطلوب`

/** an amount in dinars: whole, positive, and inside what تفقيط can spell */
const money = (what: string) =>
  z.coerce
    .number({ error: required(what) })
    .int(`${what} يجب أن يكون رقماً صحيحاً بالدينار، بدون فلوس`)
    .min(1, `${what} يجب أن يكون أكبر من صفر`)
    .max(MONEY_MAX, `${what} يجب ألا يزيد على ${MONEY_MAX.toLocaleString('en-US')} د.ك`)

const text = (what: string, max: number, min = 2) =>
  z.string().trim().min(min, required(what)).max(max)

const optionalText = (max: number) => z.string().trim().max(max).default('')

/** twelve digits as they appear on the card, no separators */
const civilId = (what: string) =>
  z
    .string()
    .trim()
    .transform(toLatinDigits)
    .refine((v) => v.length > 0, required(what))
    .refine((v) => /^\d{12}$/.test(v), `${what} يجب أن يكون اثني عشر رقماً`)

const nationality = (what: string) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, required(what))
    .refine((v) => isNationalityCode(v), 'اختر الجنسية من القائمة')

const gender = z.enum(['male', 'female'], { error: 'اختر الجنس' })

/** d/m/yyyy, as every date in this app is stored */
const dateValue = z
  .string()
  .trim()
  .transform(toLatinDigits)
  .refine((v) => v.length > 0, required('تاريخ العقد'))
  .refine((v) => longDateAr(v) !== '', 'تاريخ العقد غير صحيح')

/** the eight questions asked of the client, and of the guarantor */
const personFields = (what: string) => ({
  title: text(`لقب ${what}`, 40),
  name: text(`اسم ${what}`, 200, 3),
  gender,
  nationality: nationality(`جنسية ${what}`),
  civil_id: civilId(`الرقم المدني ل${what}`),
  phone: text(`رقم هاتف ${what}`, 40).transform(toLatinDigits),
  email: z
    .string()
    .trim()
    .min(1, required(`البريد الالكتروني ل${what}`))
    .max(200)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'البريد الالكتروني غير صحيح'),
  address: text(`عنوان ${what}`, 500, 3),
})

/**
 * `client_name`, `client_gender`, … — the same eight under one prefix.
 *
 * The mapped return type is what makes the inferred value type exact: without
 * it, computed keys widen the object to an index signature and every field
 * becomes `unknown`, which would quietly take `fees_total` with it.
 */
type Prefixed<P extends string, T> = { [K in keyof T & string as `${P}_${K}`]: T[K] }

function personShape<P extends string>(
  prefix: P,
  what: string,
): Prefixed<P, ReturnType<typeof personFields>> {
  return Object.fromEntries(
    Object.entries(personFields(what)).map(([key, value]) => [
      `${prefix}_${key}`,
      value,
    ]),
  ) as Prefixed<P, ReturnType<typeof personFields>>
}

/**
 * Everything the guarantor section asks, but only when there is a guarantor.
 * A section the lawyer never opened must not hold the form hostage, so these
 * are loose here and tightened in `superRefine` — the same shape the pleadings
 * use for a question that depends on another answer.
 */
const optionalPerson = {
  guarantor_title: optionalText(40),
  guarantor_name: optionalText(200),
  guarantor_gender: optionalText(10),
  guarantor_nationality: optionalText(20),
  guarantor_civil_id: optionalText(20),
  guarantor_phone: optionalText(40),
  guarantor_email: optionalText(200),
  guarantor_address: optionalText(500),
}

const optionalAccused = {
  accused_title: optionalText(40),
  accused_name: optionalText(200),
  accused_gender: optionalText(10),
  accused_nationality: optionalText(20),
  accused_civil_id: optionalText(20),
  accused_relation: optionalText(60),
}

export const contractFormSchema = z
  .object({
    date: dateValue,

    ...personShape('client', 'المتعاقد'),

    case_no: text('رقم القضية', 120, 1),
    case_desc: text('وصف القضية', 500),

    mode: z.enum(CONTRACT_MODES, { error: 'اختر صفة التعاقد' }),
    ...optionalAccused,

    fees_mode: z.enum(FEE_MODES, { error: 'اختر طريقة السداد' }),
    fees_total: money('مبلغ الأتعاب'),
    fees_first: optionalText(20),
    fees_second: optionalText(20),
    fees_second_due: optionalText(500),
    fees_other_text: optionalText(1000),

    has_additional_work: z.boolean(),
    additional_work: optionalText(1000),

    has_guarantor: z.boolean(),
    ...optionalPerson,
  })
  .superRefine((v, ctx) => {
    const fail = (field: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [field], message })

    const need = (field: string, value: string, message: string) => {
      if (!value.trim()) fail(field, message)
    }

    /* --- the accused, when someone else is contracting for him (§4.3) --- */
    if (v.mode === 'third_party') {
      need('accused_title', v.accused_title, required('لقب المتهم'))
      need('accused_name', v.accused_name, required('اسم المتهم'))
      need('accused_gender', v.accused_gender, 'اختر جنس المتهم')
      if (!isNationalityCode(v.accused_nationality)) {
        fail('accused_nationality', 'اختر جنسية المتهم من القائمة')
      }
      const cid = toLatinDigits(v.accused_civil_id)
      if (!/^\d{12}$/.test(cid)) {
        fail('accused_civil_id', 'الرقم المدني للمتهم يجب أن يكون اثني عشر رقماً')
      }
      need('accused_relation', v.accused_relation, required('صلة القرابة بالمتعاقد'))
    }

    /* --- the fees (§4.4) --- */
    if (v.fees_mode === 'two') {
      // an empty box is missing, not «zero» — `z.coerce.number('')` is 0 and
      // would otherwise be reported as an amount that is too small
      const amount = (field: string, raw: string, what: string) => {
        if (!raw.trim()) {
          fail(field, required(what))
          return null
        }
        const parsed = money(what).safeParse(toLatinDigits(raw))
        if (!parsed.success) {
          fail(field, parsed.error.issues[0].message)
          return null
        }
        return parsed.data
      }
      const first = amount('fees_first', v.fees_first, 'الدفعة الأولى')
      const second = amount('fees_second', v.fees_second, 'الدفعة الثانية')
      need(
        'fees_second_due',
        v.fees_second_due,
        required('موعد استحقاق الدفعة الثانية'),
      )
      // the one rule §9 says a JSON Schema cannot express
      if (first !== null && second !== null && first + second !== v.fees_total) {
        fail(
          'fees_second',
          `مجموع الدفعتين (${first + second} د.ك) لا يساوي إجمالي الأتعاب (${v.fees_total} د.ك)`,
        )
      }
    }
    if (v.fees_mode === 'other') {
      need('fees_other_text', v.fees_other_text, required('بيان طريقة السداد'))
    }

    /* --- the two yes/no questions: answered yes, it must say what --- */
    if (v.has_additional_work) {
      need('additional_work', v.additional_work, required('وصف الأعمال الإضافية'))
    }

    if (v.has_guarantor) {
      need('guarantor_title', v.guarantor_title, required('لقب الكفيل'))
      need('guarantor_name', v.guarantor_name, required('اسم الكفيل'))
      need('guarantor_gender', v.guarantor_gender, 'اختر جنس الكفيل')
      if (!isNationalityCode(v.guarantor_nationality)) {
        fail('guarantor_nationality', 'اختر جنسية الكفيل من القائمة')
      }
      const cid = toLatinDigits(v.guarantor_civil_id)
      if (!/^\d{12}$/.test(cid)) {
        fail('guarantor_civil_id', 'الرقم المدني للكفيل يجب أن يكون اثني عشر رقماً')
      }
      need('guarantor_phone', v.guarantor_phone, required('رقم هاتف الكفيل'))
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.guarantor_email.trim())) {
        fail('guarantor_email', 'البريد الالكتروني للكفيل غير صحيح')
      }
      need('guarantor_address', v.guarantor_address, required('عنوان الكفيل'))
    }
  })

export type ContractFormValues = z.infer<typeof contractFormSchema>

/* ---------------------------------------------------------------------- */

const engineGender = (value: string) => (value === 'female' ? 'f' : 'm')

function person(values: Record<string, unknown>, prefix: string): ContractPerson {
  const get = (key: string) => String(values[`${prefix}_${key}`] ?? '').trim()
  const female = get('gender') === 'female'
  return {
    title: get('title'),
    name: get('name'),
    gender: engineGender(get('gender')),
    nationality: nationalityAdjective(get('nationality'), female),
    civil_id: toLatinDigits(get('civil_id')),
    phone: toLatinDigits(get('phone')),
    email: get('email'),
    address: get('address'),
  }
}

/**
 * The form's answers as the engine wants them (§4).
 *
 * Three things change shape on the way: the date becomes the Arabic text the
 * contract prints («22 أكتوبر 2026»), a nationality code becomes the agreed
 * adjective, and a section the lawyer left switched off is dropped entirely
 * rather than sent empty — `accused` in self mode and a null `guarantor` are
 * what tell the engine which clauses to write.
 */
export function toContractInput(values: ContractFormValues): ContractInput {
  const v = values as unknown as Record<string, unknown>
  const str = (key: string) => String(v[key] ?? '').trim()

  const input: ContractInput = {
    mode: values.mode,
    date: longDateAr(str('date')),
    client: person(v, 'client'),
    case_no: str('case_no'),
    case_desc: str('case_desc'),
    fees: { mode: values.fees_mode, total: Number(values.fees_total) },
    additional_work: values.has_additional_work ? str('additional_work') : null,
    guarantor: values.has_guarantor ? person(v, 'guarantor') : null,
  }

  if (values.mode === 'third_party') {
    const female = str('accused_gender') === 'female'
    input.accused = {
      title: str('accused_title'),
      name: str('accused_name'),
      gender: engineGender(str('accused_gender')),
      nationality: nationalityAdjective(str('accused_nationality'), female),
      civil_id: toLatinDigits(str('accused_civil_id')),
      relation: str('accused_relation'),
    }
  }

  if (values.fees_mode === 'two') {
    input.fees!.first = Number(toLatinDigits(str('fees_first')))
    input.fees!.second = Number(toLatinDigits(str('fees_second')))
    input.fees!.second_due = str('fees_second_due')
  }
  if (values.fees_mode === 'other') {
    input.fees!.other_text = str('fees_other_text')
  }

  return input
}

/* ---------------------------------------------------------------------- */

/** §9's `$defs.person` */
const inputPerson = z.object({
  title: z.string().min(1),
  name: z.string().min(1),
  gender: z.enum(['m', 'f']),
  nationality: z.string().min(1),
  civil_id: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().min(1),
  address: z.string().min(1),
})

const inputMoney = z.number().int().min(1).max(MONEY_MAX)

/**
 * §9, written out. This is a guard on our own transform, not on the lawyer's
 * typing, so its messages are for a developer reading a log — nothing a user
 * does should ever reach them.
 */
export const contractInputSchema = z
  .object({
    mode: z.enum(CONTRACT_MODES),
    date: z.string().min(1),
    client: inputPerson,
    accused: z
      .object({
        title: z.string().min(1),
        name: z.string().min(1),
        gender: z.enum(['m', 'f']),
        nationality: z.string().min(1),
        civil_id: z.string().min(1),
        relation: z.string().min(1),
      })
      .optional(),
    case_no: z.string().min(1),
    case_desc: z.string().min(1),
    fees: z
      .object({
        mode: z.enum(FEE_MODES),
        total: inputMoney,
        first: inputMoney.optional(),
        second: inputMoney.optional(),
        second_due: z.string().min(1).optional(),
        other_text: z.string().min(1).optional(),
      })
      .superRefine((f, ctx) => {
        const bad = (message: string) => ctx.addIssue({ code: 'custom', message })
        if (f.mode === 'two') {
          if (f.first === undefined || f.second === undefined || !f.second_due) {
            bad('fees.mode=two requires first, second and second_due')
          } else if (f.first + f.second !== f.total) {
            bad('fees.first + fees.second must equal fees.total')
          }
        }
        if (f.mode === 'other' && !f.other_text)
          bad('fees.mode=other requires other_text')
      }),
    additional_work: z.string().nullable().optional(),
    guarantor: inputPerson.nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'third_party' && !v.accused) {
      ctx.addIssue({ code: 'custom', message: 'mode=third_party requires accused' })
    }
  })
