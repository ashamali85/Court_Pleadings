/**
 * عقد محاماة — the contract comes out as the lawyer verified it.
 *
 *   npx tsx scripts/contract-check.ts
 *
 * Two things are checked, and they answer different questions.
 *
 * 1. **Is it still his Arabic?** `lib/contracts/criminal-defense/engine.ts` is
 *    his `build_contract.js` ported to a module, and the stack file says «copy
 *    verbatim, do not modify». A port can be wrong in two ways: the mechanics
 *    can break, which the tests below catch, or a sentence can quietly change,
 *    which nothing catches by itself — it type-checks, it renders, and only
 *    someone reading Arabic against a signed contract would notice. So every
 *    Arabic string in the port is compared with every Arabic string in §10 of
 *    docs/business-rules/contract-stack.md, which is his file byte for byte.
 *
 * 2. **Does it still produce what he signed off?** §11 of the same file is his
 *    own test table — clause counts, placeholder counts and three تفقيط
 *    results — and that is what the rest of this asserts, by unzipping the
 *    .docx and reading the text back out of document.xml.
 */
import { readFileSync } from 'node:fs'
import PizZip from 'pizzip'
import {
  buildContract,
  type ContractInput,
} from '@/lib/contracts/criminal-defense/engine'
import { contractSections } from '@/lib/contracts/criminal-defense/form'
import {
  contractFormSchema,
  contractInputSchema,
  toContractInput,
} from '@/lib/contracts/criminal-defense/schema'
import { contentDefaults } from '@/lib/content/defaults'
import { nationalityAdjective } from '@/lib/nationalities'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n      got ${actual}\n      want ${expected}`}`,
  )
}

function has(label: string, haystack: string, needle: string) {
  check(label, haystack.includes(needle) ? 'present' : `missing: ${needle}`, 'present')
}

function hasNot(label: string, haystack: string, needle: string) {
  check(label, haystack.includes(needle) ? `present: ${needle}` : 'absent', 'absent')
}

/* ===================================================================== */
/* 1. the port says exactly what the lawyer's file says                   */
/* ===================================================================== */

const STACK = 'docs/business-rules/contract-stack.md'
const stack = readFileSync(STACK, 'utf8')

/** §10's code block — his file, unedited, inside the document */
function referenceSource(): string {
  const start = stack.indexOf('```javascript')
  const end = stack.indexOf('```', start + 13)
  if (start === -1 || end === -1) {
    console.log(`FAIL  ${STACK} has no javascript block to compare against`)
    failures += 1
    return ''
  }
  return stack.slice(start + 13, end)
}

const ARABIC = /[؀-ۿ]/

/**
 * Every quoted string in a source file that contains Arabic.
 *
 * Both files are hand-written JavaScript/TypeScript, so the strings are
 * literals and template literals; this reads them without parsing either
 * language. `${…}` holes inside a template literal are what the engine uses
 * for the gender and self/third-party branches, and they are left in place —
 * a changed hole is a changed sentence.
 *
 * Quote marks are the one thing normalised: the lawyer writes `"عنه"` and
 * this repository's formatter writes `'عنه'`, and that difference appears
 * inside a `${…}` hole. It is not a difference in the contract.
 */
function arabicStrings(source: string): string[] {
  const out: string[] = []
  // '…' | "…" | `…`, non-greedy, honouring backslash escapes
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g
  for (const m of source.matchAll(re)) {
    const value = m[1] ?? m[2] ?? m[3] ?? ''
    if (ARABIC.test(value)) out.push(value.replace(/["']/g, '"'))
  }
  return out
}

const reference = arabicStrings(referenceSource())
const ported = arabicStrings(
  readFileSync('lib/contracts/criminal-defense/engine.ts', 'utf8'),
)

console.log(`--- §10 holds ${reference.length} Arabic strings`)

/*
 * Compared as multisets. Order moved when the code was reformatted (prettier
 * wraps differently), and a sentence appearing twice must appear twice in
 * both, so neither a plain diff nor a set comparison is right.
 */
function tally(values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}

{
  const want = tally(reference)
  const got = tally(ported)

  // the port adds its own comments and the labels of nothing else; anything in
  // §10 that is not in the port is a sentence that was lost or reworded
  const missing = [...want].filter(([text, n]) => (got.get(text) ?? 0) < n)
  check(
    'every Arabic string in §10 survives in the port',
    missing.map(([text]) => text.slice(0, 60)).join(' | '),
    '',
  )

  /*
   * And the other direction, restricted to strings long enough to be contract
   * text: the port's own file comment is Arabic too, and a doc comment is not
   * a clause. Twenty characters is comfortably below the shortest clause and
   * comfortably above «الطرف الأول:».
   */
  const added = [...got].filter(
    ([text, n]) => text.length >= 20 && (want.get(text) ?? 0) < n,
  )
  check(
    'the port invents no contract text of its own',
    added.map(([text]) => text.slice(0, 60)).join(' | '),
    '',
  )
}

/* ===================================================================== */
/* 2. §11's own test table                                                */
/* ===================================================================== */

/*
 * From here on everything needs the generator, which is asynchronous
 * (`Packer.toBuffer`). tsx runs this file as CommonJS, where top-level await
 * is not available, so the rest lives in `main()`.
 */

/** the document's text, with each paragraph on its own line */
async function textOf(input: ContractInput): Promise<string> {
  const buffer = await buildContract(input)
  const xml = new PizZip(buffer).file('word/document.xml')?.asText() ?? ''
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** «البند الأول (…)» — one per clause, so counting them counts the clauses */
/*
 * Anchored to the start of a paragraph: a clause heading is a paragraph of its
 * own, while «في البند الثاني من هذا العقد إجماليها (2500 د.ك.)» inside the
 * fees clause looks just like one in the middle of a line.
 */
const clauseCount = (text: string) => (text.match(/^البند [^\n(]+ \(/gm) ?? []).length

/** a yellow placeholder, printed as [label] */
const placeholders = (text: string) => text.match(/\[[^\]]+\]/g) ?? []

/* ---- §5 example A: the accused contracts for himself, paid in full ---- */

const EXAMPLE_A: ContractInput = {
  mode: 'self',
  date: '22 أكتوبر 2026',
  client: {
    title: 'السيد',
    name: 'أحمد علي الكندري',
    gender: 'm',
    nationality: 'كويتي',
    civil_id: '290010100000',
    phone: '99999999',
    email: 'ahmad@example.com',
    address: 'الجابرية، قطعة 1، شارع 5، منزل 10',
  },
  case_no: '123/2026 جنح حولي',
  case_desc: 'إساءة استعمال الهاتف',
  fees: { mode: 'full', total: 2500 },
  additional_work: null,
  guarantor: null,
}

async function main() {
  {
    const text = await textOf(EXAMPLE_A)
    console.log('\n--- §11 example A — self, full payment')
    check('21 clauses', clauseCount(text), 21)
    check('no placeholders', placeholders(text).length, 0)
    // §11: «ألفان وخمسمائة» ✔
    has('2500 in words', text, 'ألفان وخمسمائة دينار كويتي فقط')
    has('paid in full on signing', text, 'تسدد كاملة فور التوقيع على هذا العقد')
    has('effective once the whole fee is paid', text, 'إلا بعد سداد الأتعاب كاملة')
    // self mode: the cooperation clause, and no third-party obligations
    has('التوكيل والتعاون مع الدفاع', text, 'البند الخامس (التوكيل والتعاون مع الدفاع)')
    hasNot('no third-party clause', text, 'بصفته متعاقداً لمصلحة المتهم')
    hasNot('no guarantee clause', text, 'الكفالة التضامنية')
    has('two originals', text, 'من نسختين أصليتين')
    has('masculine agreement', text, 'ويقيم في')
    hasNot('no feminine agreement', text, 'وتقيم في')
    // the cross-references resolve to clause numbers, not to markers
    hasNot('no unresolved prison reference', text, '{{REF_prison}}')
    has(
      'exclusions point at the scope clause',
      text,
      'ما ورد في البند الثاني من هذا العقد',
    )
    has(
      'exclusion 4 points at the prison clause',
      text,
      'ما ورد في البند الرابع من هذا العقد',
    )
    // §4.5: the fixed values the form must never be asked for
    has('firm, with its CR number', text, 'رقم السجل التجاري (475059)')
    has('prison visit fee', text, '(500 د.ك.) (خمسمائة دينار كويتي)')
    has('appeal deadline', text, '(5) خمسة أيام')
    check('two signature columns', (text.match(/التوقيع: /g) ?? []).length, 2)
  }

  /* ---- §5 example B: a mother contracts for her son, two installments ---- */

  const B: ContractInput = {
    mode: 'third_party',
    date: '22 أكتوبر 2026',
    client: {
      title: 'السيدة',
      name: 'فاطمة محمد',
      gender: 'f',
      nationality: 'كويتية',
      civil_id: '280010100000',
      phone: '98888888',
      email: 'f@example.com',
      address: 'السالمية',
    },
    accused: {
      title: 'السيد',
      name: 'محمد عبدالله محمد',
      gender: 'm',
      nationality: 'كويتي',
      civil_id: '300010100000',
      relation: 'ابنها',
    },
    case_no: '9/2026 جنايات',
    case_desc: 'حيازة مواد مخدرة بقصد التعاطي',
    fees: {
      mode: 'two',
      total: 3500,
      first: 2000,
      second: 1500,
      second_due: 'بعد مرور ستة أشهر ميلادية من تاريخ التوقيع على هذا العقد',
    },
    additional_work: 'التظلم من أمر الحبس الاحتياطي.',
    guarantor: null,
  }

  {
    const text = await textOf(B)
    console.log('\n--- §11 example B — third party, two installments, additional work')
    check('21 clauses', clauseCount(text), 21)
    check('no placeholders', placeholders(text).length, 0)
    has(
      'the accused is named in the preamble',
      text,
      'ولمصلحة السيد/ محمد عبدالله محمد',
    )
    has('his relation to the client', text, 'وصلته بالطرف الثاني: (ابنها)')
    has(
      'third-party obligations replace cooperation',
      text,
      'التزامات الطرف الثاني بصفته متعاقداً لمصلحة المتهم',
    )
    hasNot('cooperation clause is gone', text, 'التوكيل والتعاون مع الدفاع')
    has(
      'the fourth full-fee case appears',
      text,
      '4- إذا امتنع المتهم عن إصدار التوكيل اللازم',
    )
    has('liability extends to the accused', text, 'ويسري حكم هذا البند في حق المتهم')
    has('first installment in words', text, '(2000 د.ك.) (ألفان دينار كويتي)')
    has('second installment in words', text, '(1500 د.ك.) (ألف وخمسمائة دينار كويتي)')
    has('total in words', text, 'ثلاثة آلاف وخمسمائة دينار كويتي فقط')
    has('second installment due date', text, 'يستحق بعد مرور ستة أشهر ميلادية')
    has(
      'effective once the first installment is paid',
      text,
      'إلا بعد سداد الدفعة الأولى',
    )
    has(
      'the additional work joins the scope clause',
      text,
      'كما يشمل هذا العقد الأعمال الإضافية الآتية: التظلم من أمر الحبس الاحتياطي.',
    )
    // the client is a woman, the accused a man: the agreement must not leak
    has('feminine agreement for the client', text, 'وتقيم في')
    has('her phone', text, 'ورقم هاتفها هو')
    has('her email', text, 'وبريدها الالكتروني هو')
    has(
      'feminine reference for the client',
      text,
      'ويشار إليها في هذا العقد بالطرف الثاني',
    )
    has(
      'masculine reference for the accused',
      text,
      'ويشار إليه في هذا العقد بـ(المتهم)',
    )
  }

  /* ---- §5 example C: custom payment, with a joint guarantor ---- */

  const C: ContractInput = {
    mode: 'self',
    date: '22 أكتوبر 2026',
    client: {
      title: 'السيد',
      name: 'عبدالله سالم',
      gender: 'm',
      nationality: 'كويتي',
      civil_id: '270010100000',
      phone: '97777777',
      email: 'a@example.com',
      address: 'الفنطاس',
    },
    case_no: '77/2026 جنح الفروانية',
    case_desc: 'شيك بدون رصيد',
    fees: {
      mode: 'other',
      total: 12750,
      other_text: 'تسدد على ثلاث دفعات شهرية متساوية تبدأ من تاريخ التوقيع.',
    },
    guarantor: {
      title: 'السيد',
      name: 'سالم عبدالله',
      gender: 'm',
      nationality: 'كويتي',
      civil_id: '260010100000',
      phone: '96666666',
      email: 's@example.com',
      address: 'الفنطاس',
    },
  }

  {
    const text = await textOf(C)
    console.log('\n--- §11 example C — other payment, joint guarantor')
    check('22 clauses', clauseCount(text), 22)
    check('no placeholders', placeholders(text).length, 0)
    // §11: «اثنا عشر ألفاً وسبعمائة وخمسون» ✔
    has('12,750 in words', text, 'اثنا عشر ألفاً وسبعمائة وخمسون دينار كويتي فقط')
    has(
      'the custom arrangement',
      text,
      'تسدد على النحو الآتي: تسدد على ثلاث دفعات شهرية متساوية',
    )
    has(
      'the guarantor is the third party',
      text,
      'ويشار إليه في هذا العقد بالطرف الثالث',
    )
    has('the joint guarantee clause', text, 'الكفالة التضامنية')
    has('three parties agree, not two', text, 'فقد تم الاتفاق بينهم على الآتي')
    hasNot('not the two-party wording', text, 'فقد تم الاتفاق بينهما على الآتي')
    has('three originals', text, 'من ثلاث نسخ أصلية')
    check('three signature columns', (text.match(/التوقيع: /g) ?? []).length, 3)
    has('the third signs too', text, 'الطرف الثالث:')
    // the termination clause points at the full-fee clause, which moved by one
    // because the guarantee clause was inserted before it
    has(
      'termination points at the full-fee clause',
      text,
      'وفقاً للبند التاسع من هذا العقد',
    )
  }

  /* ---- §5 example D: the blank printable form ---- */

  {
    const text = await textOf({})
    console.log('\n--- §11 example D — the blank template')
    check('21 clauses', clauseCount(text), 21)
    // §11: 14 yellow placeholders ✔
    check('14 placeholders', placeholders(text).length, 14)
    has('date placeholder', text, '[التاريخ]')
    has('client name placeholder', text, '[اسم المتعاقد]')
    has('case number placeholder', text, '[رقم القضية]')
    has('fee placeholder', text, '[مبلغ الأتعاب]')
    has('fee in words placeholder', text, '[المبلغ كتابة]')
    // an unknown fees.mode is the payment prompt, not a silent omission
    has('payment method prompt', text, '[طريقة السداد:')
    // and the fixed text is all still there
    has('the firm', text, 'شركة مكتب علي العريان وحمد الصراف للمحاماة')
  }

  /* ===================================================================== */
  /* 3. تفقيط over its whole declared range                                 */
  /* ===================================================================== */

  console.log('\n--- amounts in words')
  {
    /** the phrase the fees clause prints for a total */
    async function spell(total: number): Promise<string> {
      const text = await textOf({ fees: { mode: 'full', total } })
      const match = text.match(/\(([^()]+) دينار كويتي فقط\)/)
      return match ? match[1] : '(not found)'
    }

    // the boundaries of each branch of `words()`, which is where it can be wrong
    check('1', await spell(1), 'واحد')
    check('11', await spell(11), 'أحد عشر')
    check('21', await spell(21), 'واحد وعشرون')
    check('100', await spell(100), 'مائة')
    check('999', await spell(999), 'تسعمائة وتسعة وتسعون')
    check('1000', await spell(1000), 'ألف')
    check('2000', await spell(2000), 'ألفان')
    check('3000', await spell(3000), 'ثلاثة آلاف')
    check('11000', await spell(11000), 'أحد عشر ألفاً')
    check('100000', await spell(100000), 'مائة ألف')
    // §4.4: "the number-to-words function supports up to 999,999"
    check(
      '999999',
      await spell(999999),
      'تسعمائة وتسعة وتسعون ألف وتسعمائة وتسعة وتسعون',
    )
    check('2500 (§11, example A)', await spell(2500), 'ألفان وخمسمائة')
    check(
      '12750 (§11, example C)',
      await spell(12750),
      'اثنا عشر ألفاً وسبعمائة وخمسون',
    )
  }

  /* ===================================================================== */
  /* 4. the form, the rules, and the transform between them                 */
  /* ===================================================================== */

  console.log('\n--- the form')

  /** a complete, valid set of answers as the form holds them */
  const answers = {
    date: '22/10/2026',
    client_title: 'السيدة',
    client_name: 'فاطمة محمد الكندري',
    client_gender: 'female',
    client_nationality: 'KW',
    client_civil_id: '280010100000',
    client_phone: '98888888',
    client_email: 'f@example.com',
    client_address: 'السالمية، قطعة 3',
    case_no: '9/2026 جنايات',
    case_desc: 'حيازة مواد مخدرة بقصد التعاطي',
    mode: 'third_party',
    accused_title: 'السيد',
    accused_name: 'محمد عبدالله محمد',
    accused_gender: 'male',
    accused_nationality: 'KW',
    accused_civil_id: '300010100000',
    accused_relation: 'ابنها',
    fees_mode: 'two',
    fees_total: '3500',
    fees_first: '2000',
    fees_second: '1500',
    fees_second_due: 'بعد مرور ستة أشهر ميلادية من تاريخ التوقيع على هذا العقد',
    fees_other_text: '',
    has_additional_work: true,
    additional_work: 'التظلم من أمر الحبس الاحتياطي.',
    has_guarantor: false,
    guarantor_title: '',
    guarantor_name: '',
    guarantor_gender: '',
    guarantor_nationality: '',
    guarantor_civil_id: '',
    guarantor_phone: '',
    guarantor_email: '',
    guarantor_address: '',
  }

  /** what the schema says about one set of answers, by field */
  function errorsFor(values: Record<string, unknown>): Record<string, string> {
    const parsed = contractFormSchema.safeParse(values)
    if (parsed.success) return {}
    const out: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_'
      if (!out[field]) out[field] = issue.message
    }
    return out
  }

  check('a complete form passes', JSON.stringify(errorsFor(answers)), '{}')

  /* --- the rule §9 says a JSON Schema cannot express --- */
  check(
    'installments that do not add up are refused',
    Object.keys(errorsFor({ ...answers, fees_second: '1400' })).join(','),
    'fees_second',
  )
  check(
    'installments that add up are accepted',
    JSON.stringify(errorsFor({ ...answers, fees_first: '1750', fees_second: '1750' })),
    '{}',
  )

  /* --- §4.4: positive whole dinars, up to 999,999 --- */
  for (const [label, total] of [
    ['zero', '0'],
    ['negative', '-5'],
    ['fractional', '2500.5'],
    ['over the تفقيط range', '1000000'],
    ['not a number', 'كثير'],
  ] as const) {
    check(
      `an amount that is ${label} is refused`,
      'fees_total' in errorsFor({ ...answers, fees_total: total })
        ? 'refused'
        : 'accepted',
      'refused',
    )
  }

  /* --- the conditional sections: asked for only when they apply --- */
  check(
    'the accused is required in third-party mode',
    Object.keys(errorsFor({ ...answers, accused_name: '', accused_relation: '' }))
      .sort()
      .join(','),
    'accused_name,accused_relation',
  )
  check(
    'and not asked for at all in self mode',
    JSON.stringify(
      errorsFor({ ...answers, mode: 'self', accused_name: '', accused_relation: '' }),
    ),
    '{}',
  )
  check(
    'a guarantor switched on must be complete',
    'guarantor_name' in errorsFor({ ...answers, has_guarantor: true })
      ? 'refused'
      : 'accepted',
    'refused',
  )
  check(
    'additional work switched on must say what',
    'additional_work' in errorsFor({ ...answers, additional_work: '' })
      ? 'refused'
      : 'accepted',
    'refused',
  )
  check(
    'second installment needs a due date',
    'fees_second_due' in errorsFor({ ...answers, fees_second_due: '' })
      ? 'refused'
      : 'accepted',
    'refused',
  )
  check(
    'other payment needs its wording',
    'fees_other_text' in
      errorsFor({ ...answers, fees_mode: 'other', fees_other_text: '' })
      ? 'refused'
      : 'accepted',
    'refused',
  )

  /* --- a civil ID is twelve digits, in whatever digits it was typed --- */
  check(
    'eleven digits is refused',
    'client_civil_id' in errorsFor({ ...answers, client_civil_id: '28001010000' })
      ? 'refused'
      : 'accepted',
    'refused',
  )
  check(
    'Arabic-Indic digits are accepted and stored as Latin',
    JSON.stringify(errorsFor({ ...answers, client_civil_id: '٢٨٠٠١٠١٠٠٠٠٠' })),
    '{}',
  )

  /* --- the transform to the engine's own shape (§4) --- */
  console.log('\n--- the transform')
  {
    const parsed = contractFormSchema.parse(answers)
    const input = toContractInput(parsed)

    check(
      '§9 accepts what the engine is handed',
      contractInputSchema.safeParse(input).success,
      true,
    )
    check(
      'the date becomes the Arabic the contract prints',
      input.date,
      '22 أكتوبر 2026',
    )
    check('gender becomes m/f', input.client?.gender, 'f')
    // §4.2: the adjective agrees, and the engine's sentence adds «الجنسية»
    check('a woman is كويتية', input.client?.nationality, 'كويتية')
    check('a man is كويتي', input.accused?.nationality, 'كويتي')
    check('the civil ID is Latin digits', input.client?.civil_id, '280010100000')
    check('no guarantor means null, not an empty person', input.guarantor, null)
    check('the installments are numbers', input.fees?.first, 2000)
    check(
      'additional work travels as its own text',
      input.additional_work,
      'التظلم من أمر الحبس الاحتياطي.',
    )

    // self mode must not carry an accused: it is what selects the clauses
    const asSelf = toContractInput(
      contractFormSchema.parse({ ...answers, mode: 'self' }),
    )
    check('self mode sends no accused', asSelf.accused, undefined)

    // and «لا أعمال إضافية» must not send an empty string, which the engine
    // would treat as truthy text
    const noExtras = toContractInput(
      contractFormSchema.parse({
        ...answers,
        has_additional_work: false,
        additional_work: '',
      }),
    )
    check('no additional work sends null', noExtras.additional_work, null)
  }

  /* --- the adjective rule on its own --- */
  console.log('\n--- nationality agreement')
  check('KW, man', nationalityAdjective('KW', false), 'كويتي')
  check('KW, woman', nationalityAdjective('KW', true), 'كويتية')
  check('EG, woman', nationalityAdjective('EG', true), 'مصرية')
  // a label that is a country name rather than an adjective takes no ة
  check(
    'a non-adjective label is left alone',
    nationalityAdjective('SB', true).endsWith('ة'),
    false,
  )

  /* --- every label the form shows is on the content screen --- */
  console.log('\n--- wording')
  {
    const defined = contentDefaults()
    const missing: string[] = []
    for (const section of contractSections) {
      if (!(`section.criminal-defense-contract.${section.key}.title` in defined)) {
        missing.push(`section ${section.key}`)
      }
      for (const field of section.fields) {
        if (!(`field.criminal-defense-contract.${field.name}.label` in defined)) {
          missing.push(`field ${field.name}`)
        }
      }
    }
    check(
      'every section and field is editable on /admin/content',
      missing.join(', '),
      '',
    )
  }

  /* --- no field asks for something the schema will not read --- */
  {
    const inSchema = new Set(
      Object.keys(contractFormSchema.parse(answers) as Record<string, unknown>),
    )
    const orphans = contractSections
      .flatMap((s) => s.fields.map((f) => f.name))
      .filter((name) => !inSchema.has(name))
    check('every field on the form is a field the schema reads', orphans.join(', '), '')
  }

  /* --- and a section can never render empty --- */
  {
    /*
     * A `showWhen` field is unmounted when its condition is unmet. A section
     * where *every* field can be hidden at once would draw as a card with
     * nothing in it, so each section keeps at least one unconditional field —
     * the question that reveals the rest.
     */
    const emptyable = contractSections
      .filter((section) => section.fields.every((field) => field.showWhen))
      .map((section) => section.key)
    check('no section can be left with nothing in it', emptyable.join(', '), '')
  }
}

main()
  .then(() => {
    console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
    process.exit(failures ? 1 : 0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
