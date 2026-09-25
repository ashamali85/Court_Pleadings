/**
 * End-to-end check with no database: validates a sample request, derives every
 * placeholder, renders the .docx and asserts the تفقيط output.
 *
 *   npx tsx scripts/smoke.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderDocx } from '../lib/docgen'
import { toLatinDigits, weekdayAr } from '../lib/numerals'
import { amountToArabicWords, numberToArabicWords } from '../lib/tafqeet'
import { evictionTemplate } from '../lib/templates/eviction'
import { formDataToValues } from '../lib/templates'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}\n      ${actual}${ok ? '' : `\n      expected: ${expected}`}`,
  )
}

// ---------- تفقيط ----------
console.log('--- tafqeet')
check('470 (oblique)', numberToArabicWords(470), 'أربعمائة وسبعين')
check('470 (nominative)', numberToArabicWords(470, 'nominative'), 'أربعمائة وسبعون')
check('2820 (oblique)', numberToArabicWords(2820), 'ألفين وثمانمائة وعشرين')
check(
  '2820 (nominative)',
  numberToArabicWords(2820, 'nominative'),
  'ألفان وثمانمائة وعشرون',
)
check('1000', numberToArabicWords(1000), 'ألف')
check('3500', numberToArabicWords(3500), 'ثلاثة آلاف وخمسمائة')
check('11250', numberToArabicWords(11250), 'أحد عشر ألفاً ومائتين وخمسين')
check('25', numberToArabicWords(25), 'خمسة وعشرين')
check('115', numberToArabicWords(115), 'مائة وخمسة عشر')
check('200', numberToArabicWords(200), 'مائتين')
check('currency 470', amountToArabicWords(470), 'أربعمائة وسبعين دينار كويتي')
check(
  'currency 470.5',
  amountToArabicWords(470.5),
  'أربعمائة وسبعين دينار كويتي وخمسمائة فلساً',
)

// ---------- the sample case from the office's own document ----------
console.log('\n--- schema + derive')
const sample = {
  plaintiff_name:
    'ورثة حبيب محمد تقي بهبهاني، وهم كل من:\n1-السيد/ أمير حبيب محمد تقي بهبهاني – كويتي الجنسية – ب.م. (271032200626)\n2-السيد/ أنور حبيب محمد تقي بهبهاني – كويتي الجنسية – ب.م. (274051600696)',
  defendant_name: 'طارق موسى عطا عمار – أردني الجنسية – بطاقة مدنية رقم (274082805061)',
  defendant_address:
    'السالمية – قطعة (246) - شارع ناصر البدر – قسيمة (112-B) رقم العين المؤجرة (10 البرج B) – الدور الثالث – خلف مطعم كنتاكي - الرقم الآلي للشقة (19897268)، والرقم الآلي للمبنى (93973791).',
  premises_same_as_defendant: true,
  premises_address: '',
  premises_lead: 'الشقة الكائنة في',
  lease_date: '19/5/2019',
  property_use: 'سكن عائلي',
  monthly_rent: '470',
  nonpayment_start_date: '',
  arrears_from_month: '3',
  arrears_to_month: '8',
  arrears_year: '2024',
  include_eviction_request: true,
  include_penalty_clause: true,
}

const parsed = evictionTemplate.schema.safeParse(sample)
if (!parsed.success) {
  console.error('FAIL  schema rejected the sample', parsed.error.issues)
  process.exit(1)
}

const placeholders = evictionTemplate.derive(parsed.data, {}) as Record<string, string>

// the weekday is derived from the date: 19/5/2019 was a Sunday
check('lease phrase', placeholders.lease_date_phrase, 'مؤرخ في الأحد الموافق 19/5/2019')
check('weekday derivation', weekdayAr('19/5/2019'), 'الأحد')
check('weekday derivation 2', weekdayAr('29/3/2026'), 'الأحد')
check('arabic-indic digits', toLatinDigits('٤٥٠٫٥٠٠'), '450.500')
check('arabic-indic date', toLatinDigits('١٩/٥/٢٠٢٦'), '19/5/2026')
check('months count', placeholders.arrears_months_count, '6')
check('months list', placeholders.arrears_months_list, '3 و 4 و 5 و 6 و 7 و 8')
check('total', placeholders.arrears_total, '2820')
check(
  'total words',
  placeholders.arrears_total_words,
  'ألفين وثمانمائة وعشرين دينار كويتي',
)
check('non-payment start', placeholders.nonpayment_start_date, '1/3/2024')
check('benefit start', placeholders.benefit_start_date, '1-9-2024')
check('ordinal eviction', placeholders.ordinal_eviction, 'أولاً')
check('ordinal arrears', placeholders.ordinal_arrears, 'ثانياً')
check('ordinal penalty', placeholders.ordinal_penalty, 'ثالثاً')
check('ordinal costs', placeholders.ordinal_costs, 'رابعاً')

// demands renumber when the optional ones are dropped
const trimmed = evictionTemplate.derive(
  { ...parsed.data, include_eviction_request: false, include_penalty_clause: false },
  {},
) as Record<string, string>
check('renumbering: arrears becomes first', trimmed.ordinal_arrears, 'أولاً')
check('renumbering: costs becomes second', trimmed.ordinal_costs, 'ثانياً')

// ---------- the four types, for BOTH sides ----------
//
// The same battery is run against المدعي and المدعى عليه. If the two ever
// stop behaving identically, this is what notices.
for (const side of [
  { prefix: 'plaintiff', labelAr: 'المدعي' },
  { prefix: 'defendant', labelAr: 'المدعى عليه' },
]) {
  console.log(`\n--- ${side.labelAr} (${side.prefix})`)
  const f = (key: string) => `${side.prefix}_${key}`

  /** validate a patched sample and return that side's composed line */
  function lineFor(patch: Record<string, unknown>): string {
    const result = evictionTemplate.schema.safeParse({ ...sample, ...patch })
    if (!result.success) {
      console.log('FAIL  did not validate:', JSON.stringify(result.error.issues))
      failures++
      return ''
    }
    const out = evictionTemplate.derive(result.data, {}) as Record<string, string>
    return out[f('name')]
  }

  /** the first error path a patched sample produces, or '' if it validated */
  function errorPath(patch: Record<string, unknown>): string {
    const result = evictionTemplate.schema.safeParse({ ...sample, ...patch })
    return result.success ? '' : result.error.issues[0].path.join('.')
  }

  check(
    'legacy free text survives',
    lineFor({}),
    (sample as unknown as Record<string, string>)[f('name')],
  )

  check(
    'شخص طبيعي',
    lineFor({
      [f('type')]: 'natural',
      [f('full_name')]: 'خالد يوسف العنزي',
      [f('civil_id')]: '289010112345',
      [f('nationality')]: 'KW',
    }),
    'خالد يوسف العنزي – كويتي الجنسية – بطاقة مدنية رقم (289010112345)',
  )

  check(
    'ورثة',
    lineFor({
      [f('type')]: 'heirs',
      [f('deceased_name')]: 'حبيب محمد تقي بهبهاني',
      [f('heirs')]: [
        { name: 'أمير حبيب بهبهاني', civil_id: '271032200626', nationality: 'KW' },
        { name: 'راج كومار', civil_id: '274051600696', nationality: 'IN' },
      ],
    }),
    'ورثة المرحوم/ حبيب محمد تقي بهبهاني، وهم كل من:\n' +
      '1- أمير حبيب بهبهاني – كويتي الجنسية – بطاقة مدنية رقم (271032200626)\n' +
      '2- راج كومار – هندي الجنسية – بطاقة مدنية رقم (274051600696)',
  )

  check(
    'شركة',
    lineFor({
      [f('type')]: 'company',
      [f('company_name')]: 'شركة الخليج العقارية',
      [f('company_form')]: 'llc',
      [f('company_register')]: '123456',
      [f('company_civil_no')]: '100234567',
    }),
    'شركة الخليج العقارية – ذات مسؤولية محدودة – سجل تجاري رقم (123456) – رقم الجهة المدني (100234567)',
  )

  check(
    'رخصة فردية',
    lineFor({
      [f('type')]: 'licence',
      [f('establishment_name')]: 'مؤسسة النور للتجارة العامة',
      [f('owner_name')]: 'سالم فهد الدوسري',
      [f('owner_civil_id')]: '280070500321',
      [f('owner_nationality')]: 'KW',
      [f('licence_register')]: '778899',
      [f('licence_civil_no')]: '100998877',
    }),
    'مؤسسة النور للتجارة العامة – سجل تجاري رقم (778899) – رقم الجهة المدني (100998877)، ' +
      'ويملكها السيد/ سالم فهد الدوسري – كويتي الجنسية – بطاقة مدنية رقم (280070500321)',
  )

  // شكل الشركة is a closed list, so a stale or hand-posted value is rejected
  check(
    'company form must be one of the six',
    errorPath({
      [f('type')]: 'company',
      [f('company_name')]: 'شركة الخليج العقارية',
      [f('company_form')]: 'ذات مسؤولية محدودة',
      [f('company_register')]: '123456',
      [f('company_civil_no')]: '100234567',
    }),
    f('company_form'),
  )

  check(
    'civil ID must be 12 digits',
    errorPath({
      [f('type')]: 'natural',
      [f('full_name')]: 'خالد يوسف العنزي',
      [f('civil_id')]: '2890101',
      [f('nationality')]: 'KW',
    }),
    f('civil_id'),
  )

  check(
    'heir errors carry the row index',
    errorPath({
      [f('type')]: 'heirs',
      [f('deceased_name')]: 'حبيب محمد تقي بهبهاني',
      [f('heirs')]: [
        { name: 'أمير حبيب بهبهاني', civil_id: '271032200626', nationality: 'KW' },
        { name: '', civil_id: '274051600696', nationality: 'IN' },
      ],
    }),
    `${f('heirs')}.1.name`,
  )
}

// ---------- the repeatable rows arrive as an array, with Arabic digits folded ----------
console.log('\n--- rows')
{
  const form = new FormData()
  form.set('plaintiff_type', 'heirs')
  form.set('plaintiff_deceased_name', 'حبيب محمد تقي بهبهاني')
  form.set(
    'plaintiff_heirs',
    JSON.stringify([
      { name: 'أمير حبيب بهبهاني', civil_id: '٢٧١٠٣٢٢٠٠٦٢٦', nationality: 'KW' },
    ]),
  )
  const values = formDataToValues(evictionTemplate as never, form) as Record<
    string,
    unknown
  >
  const heirs = values.plaintiff_heirs as { civil_id: string }[]
  check('rows arrive as an array', Array.isArray(heirs), true)
  check('Arabic-Indic digits normalised', heirs[0].civil_id, '271032200626')
}

// ---------- the two sides are independent ----------
console.log('\n--- both sides at once')
{
  const both = evictionTemplate.schema.safeParse({
    ...sample,
    plaintiff_type: 'company',
    plaintiff_company_name: 'شركة الخليج العقارية',
    plaintiff_company_form: 'llc',
    plaintiff_company_register: '123456',
    plaintiff_company_civil_no: '100234567',
    defendant_type: 'natural',
    defendant_full_name: 'طارق موسى عطا عمار',
    defendant_civil_id: '274082805061',
    defendant_nationality: 'JO',
  })
  if (!both.success) {
    console.log('FAIL  did not validate:', JSON.stringify(both.error.issues))
    failures++
  } else {
    const out = evictionTemplate.derive(both.data, {}) as Record<string, string>
    check(
      'المدعي keeps its own line',
      out.plaintiff_name,
      'شركة الخليج العقارية – ذات مسؤولية محدودة – سجل تجاري رقم (123456) – رقم الجهة المدني (100234567)',
    )
    check(
      'المدعى عليه keeps its own line',
      out.defendant_name,
      'طارق موسى عطا عمار – أردني الجنسية – بطاقة مدنية رقم (274082805061)',
    )
    check(
      'the lawyer can still override the defendant line',
      (
        evictionTemplate.derive(both.data, {
          defendant_name: 'المستأجر المجهول',
        }) as Record<string, string>
      ).defendant_name,
      'المستأجر المجهول',
    )
  }
}

// ---------- render ----------
console.log('\n--- render')
const templateBytes = readFileSync(
  join(process.cwd(), 'templates', 'eviction-petition.docx'),
)
const out = renderDocx(templateBytes, evictionTemplate.derive(parsed.data, {}))
writeFileSync(join(process.cwd(), 'sample-output.docx'), out)
console.log(`PASS  wrote sample-output.docx (${out.byteLength} bytes)`)

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
