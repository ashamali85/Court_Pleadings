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
