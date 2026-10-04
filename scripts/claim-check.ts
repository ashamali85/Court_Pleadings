/**
 * The مطالبة مالية wording rules, checked against the office's own approved
 * output. Every expected string here is lifted verbatim from the lawyer's
 * package (examples/build3_cheque.json, docs/reference-text/*.txt,
 * docs/business-rules/*.md) — so if this file passes, the engine writes what
 * the office already signs.
 *
 *   npx tsx scripts/claim-check.ts
 */
import { blankCase, blankParty, type ClaimCase } from '@/lib/claim/case'
import {
  composeDemand,
  composeExhibits,
  composeLawsuit,
  composeOrder,
  exhibitTotal,
} from '@/lib/claim/compose'
import { courtLevel, courtName, documentsFor } from '@/lib/claim/court'
import {
  CLAIM_DOCUMENTS,
  honorific,
  nationalityPhrase,
  objectSuffix,
  PARTY_FORMS,
  pays,
  respectful,
  verb,
  VERBS,
  vocabulary,
} from '@/lib/claim/grammar'
import {
  amountsReconcile,
  backReference,
  blankInstrument,
  describeInstrument,
  describeInstruments,
  dueFrom,
  exhibitDescription,
  hasCommercialPaper,
  type Instrument,
} from '@/lib/claim/instruments'
import { amountInWords, formatMoney, moneyPhrase } from '@/lib/claim/money'
import { allFields, formDataToValues, templates } from '@/lib/templates'
import { claimDefaults, claimTemplate } from '@/lib/templates/claim'
import { fieldString, isFieldVisible } from '@/lib/templates/visibility'
import { longDateAr } from '@/lib/numerals'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n      got      ${actual}\n      expected ${expected}`}`,
  )
}

const instrument = (over: Partial<Instrument>): Instrument => ({
  ...blankInstrument(),
  ...over,
})

// ---------- the amount ----------
console.log('--- المبلغ, against the office’s own documents')
check('figures are grouped and carry three decimals', formatMoney(7250), '7,250.000')
check('a sub-dinar amount keeps its fils', formatMoney(882.511), '882.511')
check('and a round amount still shows them', formatMoney(1000), '1,000.000')

// examples/build3_cheque.json
check(
  'the cheque case, verbatim',
  moneyPhrase(7250),
  '7,250.000 د.ك. (سبعة آلاف ومائتان وخمسون دينارًا كويتيًا)',
)
// docs/reference-text/lawsuit_template_text.txt
check(
  'the invoice case, verbatim',
  moneyPhrase(882.511),
  '882.511 د.ك. (ثمانمائة واثنان وثمانون دينارًا كويتيًا و511 فلسًا)',
)
// docs/business-rules/amr-notes.md §5
check(
  'the payment-order example, verbatim',
  moneyPhrase(4341.71),
  '4,341.710 د.ك. (أربعة آلاف وثلاثمائة وواحد وأربعون دينارًا كويتيًا و710 فلسًا)',
)
check('three to ten dinars take the plural', amountInWords(5), 'خمسة دنانير كويتية')
check(
  'a round hundred takes the bare singular',
  amountInWords(500),
  'خمسمائة دينار كويتي',
)

// ---------- the terminology pairs ----------
console.log('\n--- the three pairs, which must never mix')
check('الصحيفة: المدعي is called الطالب', vocabulary('lawsuit').claimant('m'), 'الطالب')
check(
  'الصحيفة: and the other side المعلن إليه',
  vocabulary('lawsuit').respondent('m'),
  'المعلن إليه',
)
check(
  'أمر الأداء: مقدم الطلب في المتن',
  vocabulary('order').claimant('m'),
  'مقدم الطلب',
)
check('أمر الأداء: والمقدم ضده', vocabulary('order').respondent('m'), 'المقدم ضده')
check(
  'أمر الأداء: (الدائن) في الرأس',
  vocabulary('order').headingClaimant('m'),
  'الدائن',
)
check(
  'أمر الأداء: (المدين) في الرأس',
  vocabulary('order').headingRespondent('m'),
  'المدين',
)
check('الحافظة: المدعي', vocabulary('exhibits').claimant('m'), 'المدعي')
check('الحافظة: المدعى عليه', vocabulary('exhibits').respondent('m'), 'المدعى عليه')

// the pairs are reached per document, so no document can borrow another's word
const everyWord = CLAIM_DOCUMENTS.flatMap((doc) => [
  vocabulary(doc).claimant('m'),
  vocabulary(doc).respondent('m'),
])
check('no two documents share a role word', new Set(everyWord).size, everyWord.length)
const exhibitWords = PARTY_FORMS.flatMap((form) => [
  vocabulary('exhibits').claimant(form),
  vocabulary('exhibits').respondent(form),
])
check(
  'الحافظة has no word for المعلن إليه to borrow',
  exhibitWords.includes('المعلن إليه'),
  false,
)

// ---------- agreement ----------
console.log('\n--- التذكير والتأنيث والجمع')
// examples/build3_cheque.json: a company claimant is feminine throughout
check('a company is feminine', vocabulary('lawsuit').claimant('f'), 'الطالبة')
check('plural, as a subject', vocabulary('lawsuit').claimant('pl'), 'الطالبون')
check(
  'plural, after a preposition',
  vocabulary('lawsuit').claimant('pl', 'oblique'),
  'الطالبين',
)
check('المعلن إليها', vocabulary('lawsuit').respondent('f'), 'المعلن إليها')
check('المعلن إليهم', vocabulary('lawsuit').respondent('pl'), 'المعلن إليهم')
check('مقدمو الطلب', vocabulary('order').claimant('pl'), 'مقدمو الطلب')
check('مقدمي الطلب', vocabulary('order').claimant('pl', 'oblique'), 'مقدمي الطلب')

check('السيدة/', honorific('f'), 'السيدة')
check('السادة/', honorific('pl'), 'السادة')
check('المحترمة', respectful('f'), 'المحترمة')
check('ترتبط الطالبة', `${verb(VERBS.relates, 'f')} الطالبة`, 'ترتبط الطالبة')
check('وتداين الطالبة', `و${verb(VERBS.isOwed, 'f')} الطالبة`, 'وتداين الطالبة')
check('a plural subject keeps the verb singular', verb(VERBS.relates, 'pl'), 'يرتبط')
check('إلزامها', `إلزام${objectSuffix('f')}`, 'إلزامها')
check('إلزامهم', `إلزام${objectSuffix('pl')}`, 'إلزامهم')
check('بأن تؤدي', `بأن ${pays('f')}`, 'بأن تؤدي')
check('بأن يؤدوا', `بأن ${pays('pl')}`, 'بأن يؤدوا')

check('كويتي الجنسية', nationalityPhrase('KW', 'm'), 'كويتي الجنسية')
check('كويتية الجنسية', nationalityPhrase('KW', 'f'), 'كويتية الجنسية')
check('أردني الجنسية', nationalityPhrase('JO', 'm'), 'أردني الجنسية')
check('هندية الجنسية', nationalityPhrase('IN', 'f'), 'هندية الجنسية')
check('بدون جنسية, either way', nationalityPhrase('STATELESS', 'f'), 'بدون جنسية')
check(
  'a bracketed clarification keeps the ة on the adjective',
  nationalityPhrase('CD', 'f'),
  'كونغولية (جمهورية الكونغو الديمقراطية) الجنسية',
)

// ---------- the debt instrument ----------
console.log('\n--- سند الدين')
const cheque = instrument({
  kind: 'cheque',
  number: '000123',
  date: '1/3/2026',
  bank: 'بنك المثال',
  returned: true,
  amount: 7250,
})

check('1/3/2026 reads as a date', longDateAr('1/3/2026'), '1 مارس 2026')
// examples/build3_cheque.json, law_body[0]
check(
  'the bounced cheque, verbatim',
  describeInstrument(cheque),
  'الشيك رقم (000123) المؤرخ 1 مارس 2026 المسحوب على بنك المثال بمبلغ ' +
    '7,250.000 د.ك. (سبعة آلاف ومائتان وخمسون دينارًا كويتيًا)، وقد رُدّ الشيك من البنك',
)
check(
  'a stamped invoice is introduced indefinite, with the stamp first',
  describeInstrument(
    instrument({ kind: 'invoice', number: '55512', date: '30/8/2025', stamped: true }),
    { respondent: 'المعلن إليه', style: 'subject' },
  ),
  'فاتورة ممهورة بختم وتوقيع المعلن إليه بما يثبت الاستلام، ورقمها (55512)، وتاريخها 30 أغسطس 2025',
)
check(
  'and pointed back at with the article',
  describeInstrument(
    instrument({ kind: 'invoice', number: '55512', date: '30/8/2025', stamped: true }),
    { style: 'reference' },
  ),
  'الفاتورة رقم (55512) المؤرخة 30 أغسطس 2025',
)
check(
  'a cheque does not repeat its amount when pointed back at',
  describeInstrument(cheque, { style: 'reference' }),
  'الشيك رقم (000123) المؤرخ 1 مارس 2026',
)
check(
  'المستحقة عليكم agrees with a feminine instrument',
  dueFrom([instrument({ kind: 'invoice' })]),
  'المستحقة',
)
check('and المستحق with a cheque', dueFrom([cheque]), 'المستحق')
check(
  'an unstamped invoice does not claim to be stamped',
  describeInstrument(
    instrument({ kind: 'invoice', number: '55512', date: '30/8/2025' }),
  ),
  'الفاتورة رقم (55512) المؤرخة 30 أغسطس 2025',
)
check(
  'أخرى is the client’s own words',
  describeInstrument(instrument({ kind: 'other', text: 'عقد مقاولة مؤرخ 2024' })),
  'عقد مقاولة مؤرخ 2024',
)

check('الشيك سالف الذكر', backReference([cheque]), 'الشيك سالف الذكر')
check(
  'الفواتير سالفة الذكر',
  backReference([
    instrument({ kind: 'invoice', number: '1' }),
    instrument({ kind: 'invoice', number: '2' }),
  ]),
  'الفواتير سالفة الذكر',
)
check(
  'a mixture becomes السندات',
  backReference([cheque, instrument({ kind: 'invoice' })]),
  'السندات سالفة الذكر',
)
check(
  'several instruments each carry their own amount',
  describeInstruments(
    [
      instrument({ kind: 'invoice', number: '1', date: '1/1/2026', amount: 1000 }),
      instrument({ kind: 'invoice', number: '2', date: '2/1/2026', amount: 500 }),
    ],
    'المعلن إليه',
  ),
  'الفاتورة رقم (1) المؤرخة 1 يناير 2026 بمبلغ 1,000.000 د.ك. (ألف دينار كويتي)، ' +
    'والفاتورة رقم (2) المؤرخة 2 يناير 2026 بمبلغ 500.000 د.ك. (خمسمائة دينار كويتي)',
)
check(
  'the exhibit row names the instrument by number',
  exhibitDescription(cheque),
  'صورة ضوئية من (الشيك رقم 000123)',
)

// ---------- how many documents, and which court ----------
console.log('\n--- المخرجات والمحكمة')
check('a cheque is a commercial paper', hasCommercialPaper([cheque]), true)
check('an invoice is not', hasCommercialPaper([instrument({ kind: 'invoice' })]), false)
check(
  'one commercial paper among several is enough',
  hasCommercialPaper([instrument({ kind: 'invoice' }), cheque]),
  true,
)
check('a commercial paper produces four documents', documentsFor([cheque]).length, 4)
check(
  'and anything else produces two',
  documentsFor([instrument({ kind: 'invoice' })]).join(','),
  'lawsuit,exhibits',
)

check('5,001 د.ك. is the full court', courtLevel(5001).courtAr, 'الكلية')
check('one fils below it is not', courtLevel(5000.999).courtAr, 'الجزئية')
check('the order follows the court', courtLevel(5001).orderAr, 'كلي')
// docs/reference-text/amr_template_text.txt — 4,341.710 د.ك. at محكمة الرقعي
check('the office’s own example', courtName('الرقعي', 4341.71), 'محكمة الرقعي الجزئية')
check(
  'and the cheque case goes up a level',
  courtName('الرقعي', 7250),
  'محكمة الرقعي الكلية',
)
check('a court nobody named still reads', courtName('', 7250), 'المحكمة الكلية')

// ---------- the amounts must add up ----------
console.log('\n--- تعدد السندات')
check(
  'two instruments that add up',
  amountsReconcile([instrument({ amount: 1000 }), instrument({ amount: 250 })], 1250)
    .ok,
  true,
)
const short = amountsReconcile([instrument({ amount: 1000 })], 1250)
check('one that does not is reported, not swallowed', short.ok, false)
check('with the gap named', short.difference, -250)

// ---------- the documents, composed ----------
//
// Both cases below are the office's own examples (examples/build3_invoice.json
// and examples/build3_cheque.json). The expected strings are the paragraphs
// that package contains, so a diff here is a diff against what the lawyer has
// already signed.
console.log('\n--- صحيفة الدعوى, against examples/build3_invoice.json')

const invoiceCase: ClaimCase = {
  ...blankCase(),
  claimant: {
    ...blankParty('company'),
    name: 'شركة المثال التجارية شركة الشخص الواحد',
    entityCivilNo: '0000000',
    commercialRegister: '000000',
  },
  respondent: {
    ...blankParty('man'),
    name: 'فلان عبد الله الفلاني',
    nationality: 'KW',
    civilId: '000000000000',
  },
  respondentAddress:
    'منطقة المثال – قطعة (1) – شارع (10) – منزل رقم (5) – الدور الأرضي',
  amount: 882.511,
  relationship: 'commercial',
  instruments: [
    instrument({ kind: 'invoice', number: '12345', date: '30/8/2025', stamped: true }),
  ],
  legalInterest: true,
}

const invoice = composeLawsuit(invoiceCase)
const MONEY_882 = '882.511 د.ك. (ثمانمائة واثنان وثمانون دينارًا كويتيًا و511 فلسًا)'

check(
  'the subject paragraph, verbatim',
  invoice.body[0],
  'ترتبط الطالبة بالمعلن إليه بعلاقة تجارية، وتداين الطالبة المعلن إليه بمبلغ مالي ' +
    `وقدره ${MONEY_882} وذلك ثابت بموجب فاتورة ممهورة بختم وتوقيع المعلن إليه بما ` +
    'يثبت الاستلام، ورقمها (12345)، وتاريخها 30 أغسطس 2025.',
)
check(
  'the refusal paragraph of a non-commercial claim, verbatim',
  invoice.body[1],
  'ولما كان المعلن إليه قد امتنع بلا مبرر قانوني عن الوفاء بهذا الدين، ولم يعد من ' +
    'اللازم تقديم تكليف بالوفاء أو أمر أداء، وبالتالي تكون الدعوى مقبولة شكلًا دون ' +
    'الحاجة لتلك الإجراءات، وقد تم إنذاره بالسداد.',
)
check('and nothing else is said', invoice.body.length, 2)
check('the Article 166 paragraph stays', invoice.includeArticle166, true)
check('أولًا, verbatim', invoice.requests[0], 'أولًا: بقبول الدعوى شكلًا.')
check(
  'ثانيًا, verbatim',
  invoice.requests[1],
  'ثانيًا: وفي موضوع الدعوى: بإلزام المعلن إليه بأن يؤدي للطالبة مبلغًا وقدره ' +
    `${MONEY_882}، مع إلزامه بالفوائد القانونية بنسبة 7% من قيمة المديونية منذ ` +
    'تاريخ استحقاق الدين وحتى تمام الوفاء، وبالمصروفات ومقابل أتعاب المحاماة ' +
    'الفعلية بحكم مشمول بالنفاذ المعجل طليقًا من قيد الكفالة.',
)
check(
  'dropping the interest drops only the interest',
  composeLawsuit({ ...invoiceCase, legalInterest: false }).requests[1],
  'ثانيًا: وفي موضوع الدعوى: بإلزام المعلن إليه بأن يؤدي للطالبة مبلغًا وقدره ' +
    `${MONEY_882}، وبالمصروفات ومقابل أتعاب المحاماة الفعلية بحكم مشمول بالنفاذ ` +
    'المعجل طليقًا من قيد الكفالة.',
)
check('وأعلنته بالآتي:', invoice.announced, 'وأعلنته بالآتي:')
check('وكيل الطالبة', invoice.agent, 'وكيل الطالبة')
check(
  'the top box names the claim and the figure',
  invoice.subject,
  'دعوى مطالبة مالية بمبلغ 882.511 د.ك.',
)
check(
  'the claimant carries the office as chosen domicile',
  invoice.claimant.startsWith(
    'شركة المثال التجارية شركة الشخص الواحد – الرقم المدني للجهة (0000000) – ' +
      'رقم السجل التجاري (000000). وموطنها المختار: شركة مكتب علي العريان',
  ),
  true,
)
check(
  'the respondent line, verbatim',
  invoice.respondent,
  'السيد/ فلان عبد الله الفلاني – كويتي الجنسية – بطاقة مدنية رقم (000000000000)',
)

console.log('\n--- تكليف بالوفاء, against examples/build3_invoice.json')
const demand = composeDemand(invoiceCase)
check(
  'the first paragraph points back at the invoice with the article',
  demand.body[0],
  'إشارة إلى الموضوع المنوّه عنه أعلاه، وإلى الفاتورة رقم (12345) المؤرخة ' +
    '30 أغسطس 2025 المستحقة عليكم لصالح شركة المثال التجارية شركة الشخص الواحد ' +
    `وحيث أنكم قد تخلفتم عن سداد مبلغ ${MONEY_882} المستحق عليكم.`,
)
check(
  'the second paragraph, verbatim',
  demand.body[1],
  'لـذا فإننا بموجب هذا التكليف نكلفكم بأداء هذا المبلغ، المنشغلة به ذمتكم لصالح ' +
    'الدائنة سالفة الذكر، وحيث إن هذا المبلغ مستحق في ذمتكم، وبما أن الدائنة قد ' +
    'أحالت لنا المطالبة لاتخاذ الإجراءات القانونية بشأنها ضدكم.',
)
check(
  'the subject line, verbatim',
  demand.subject,
  `الموضوع: مطالبة بمبلغ وقدره ${MONEY_882} المستحق عليكم`,
)
check('وكيل الدائنة', demand.agent, 'وكيل الدائنة')
check(
  'the debtor is addressed with ب.م., as the form does',
  demand.respondent,
  'السيد/ فلان عبد الله الفلاني – كويتي الجنسية – ب.م. (000000000000)         المحترم',
)
check('the demand uses لموكلتنا for a company', demand.final.includes('لموكلتنا'), true)
check('and بمكتب وكيلها', demand.final.includes('بمكتب وكيلها'), true)

console.log('\n--- صحيفة الدعوى, against examples/build3_cheque.json')
const chequeCase: ClaimCase = {
  ...invoiceCase,
  amount: 7250,
  instruments: [cheque],
  courtName: 'الرقعي',
  demandPostedOn: '5/4/2026',
  orderNumber: '1234',
  orderYear: '2026',
  orderRefusedOn: '20/4/2026',
}
const chequeLawsuit = composeLawsuit(chequeCase)
const MONEY_7250 = '7,250.000 د.ك. (سبعة آلاف ومائتان وخمسون دينارًا كويتيًا)'

check(
  'the subject paragraph of a bounced cheque, verbatim',
  chequeLawsuit.body[0],
  'ترتبط الطالبة بالمعلن إليه بعلاقة تجارية، وتداين الطالبة المعلن إليه بمبلغ مالي ' +
    `وقدره ${MONEY_7250} وذلك ثابت بموجب الشيك رقم (000123) المؤرخ 1 مارس 2026 ` +
    `المسحوب على بنك المثال بمبلغ ${MONEY_7250}، وقد رُدّ الشيك من البنك.`,
)
check(
  'the 166/167 route, verbatim',
  chequeLawsuit.body[1],
  'ولما كان المعلن إليه قد امتنع بلا مبرر قانوني عن الوفاء بهذا الدين رغم التنبيه ' +
    'عليه بالسداد بموجب كتاب التكليف بالوفاء المرسل إليه بالبعثة البريدية المسجلة ' +
    'بتاريخ (5 أبريل 2026)، وحيث إن الدين ثابت بالكتابة بموجب الشيك سالف الذكر، ' +
    'ومعين المقدار فهو مبلغ من النقود معلوم مقداره وحال الأداء، فقد قامت الطالبة ' +
    'عملاً بنص المادتين (167،166) من قانون المرافعات المدنية والتجارية بتقديم طلب ' +
    'إلى القاضي المختص باستصدار أمر الأداء رقم (1234/2026 أمر أداء كلي الرقعي) إلا ' +
    'أنه جوبه بالرفض، ووقعه وختمه القاضي المختص بتاريخ 20 أبريل 2026 بما يفيد رفضه، ' +
    'بما أصبحت معه هذه الدعوى مقبولة شكلًا، وتكون مع ذلك الطالبة قد انتهجت الطريق ' +
    'الذي رسمه القانون لرفعها.',
)
check(
  'followed by the short refusal paragraph, verbatim',
  chequeLawsuit.body[2],
  'ولما كان المعلن إليه قد امتنع بلا مبرر قانوني عن الوفاء بهذا الدين رغم التنبيه ' +
    'عليه بالسداد.',
)
check('and Article 166 is dropped', chequeLawsuit.includeArticle166, false)
check(
  'the demand still points back without repeating the amount',
  composeDemand(chequeCase).body[0].includes(
    'وإلى الشيك رقم (000123) المؤرخ 1 مارس 2026 المستحق عليكم',
  ),
  true,
)

console.log('\n--- طلب أمر أداء')
const order = composeOrder(chequeCase)
check(
  'the judge is named with the level',
  order.judge,
  'السيد/ قاضي محكمة الرقعي الكلية      المحترم',
)
check('the heading labels the creditor', order.applicantLabel, '(الدائنة)')
check('and the debtor', order.respondentLabel, '(المدين)')
check(
  'the body uses مقدم الطلب, never الطالب',
  order.body[0].startsWith('تداين مقدمة الطلب المقدم ضده بمبلغ وقدره'),
  true,
)
check('no صحيفة word leaks in', order.body.join(' ').includes('المعلن إليه'), false)
check(
  'the prayer asks for the order',
  order.prayer.startsWith('تلتمس مقدمة الطلب، بعد الاطلاع على هذا الطلب'),
  true,
)
check('the decree is headed by the court', order.decree.court, 'المحكمة الكلية')
check('and numbered for the year', order.decree.number.endsWith('كلي'), true)

console.log('\n--- حافظة المستندات')
const exhibits = composeExhibits({ ...chequeCase, hasContract: true })
check('from the claimant', exhibits.fromLabel, 'المدعية')
check('against the respondent', exhibits.toLabel, 'المدعى عليه')
check(
  'the instrument is the first row',
  exhibits.rows[0].description,
  'صورة ضوئية من (الشيك رقم 000123)',
)
check('with its own date', exhibits.rows[0].date, '1/3/2026')
check(
  'a natural person is proved by a civil card',
  exhibits.rows[1].description,
  'صورة ضوئية من (البطاقة المدنية للمدعى عليه)',
)
check('the contract is listed when there is one', exhibits.rows.length, 3)
check(
  'a company respondent needs its deed and its licence',
  composeExhibits({
    ...chequeCase,
    respondent: { ...blankParty('company'), name: 'شركة المدين' },
  })
    .rows.map((r) => r.description)
    .join(' | '),
  'صورة ضوئية من (الشيك رقم 000123) | صورة ضوئية من (عقد تأسيس الشركة المدعى عليها) | ' +
    'صورة ضوئية من (الرخصة التجارية للشركة المدعى عليها)',
)
check(
  'the total counts documents and pages',
  exhibitTotal([
    { date: '', pages: 1, description: 'a' },
    { date: '', pages: 2, description: 'b' },
  ]),
  'المجموع عدد (2) مستندات تتكون من (3) ورقات',
)

console.log('\n--- a woman owing a company, to see every word move')
const feminine = composeLawsuit({
  ...invoiceCase,
  respondent: {
    ...blankParty('woman'),
    name: 'وسمية سعد فهاد العجمي',
    nationality: 'KW',
    civilId: '280110601156',
  },
})
check(
  'the respondent line agrees',
  feminine.respondent,
  'السيدة/ وسمية سعد فهاد العجمي – كويتية الجنسية – بطاقة مدنية رقم (280110601156)',
)
check('وأعلنتها بالآتي:', feminine.announced, 'وأعلنتها بالآتي:')
check(
  'ولما كانت … قد امتنعت',
  feminine.body[1].includes('ولما كانت المعلن إليها قد امتنعت'),
  true,
)
check('وقد تم إنذارها', feminine.body[1].includes('وقد تم إنذارها'), true)
check('بأن تؤدي', feminine.requests[1].includes('بأن تؤدي للطالبة'), true)
check('مع إلزامها', feminine.requests[1].includes('مع إلزامها بالفوائد'), true)

// ---------- the form ----------
//
// The composer is only reachable through a form, so the form is checked the
// same way: build what the browser would post, and see what comes back.
console.log('\n--- the request form')
{
  /** what the browser posts: every visible field the client is shown */
  function submit(values: Record<string, unknown>): Record<string, unknown> {
    const form = new FormData()
    for (const field of allFields(claimTemplate as never)) {
      if (field.adminOnly) continue // the client's form never renders these
      if (!isFieldVisible(field, values)) continue
      const value = values[field.name]
      if (field.type === 'boolean') {
        if (value) form.set(field.name, 'on')
      } else if (field.type === 'rows') {
        form.set(field.name, JSON.stringify(value ?? []))
      } else {
        form.set(field.name, fieldString(value))
      }
    }
    return formDataToValues(claimTemplate as never, form)
  }

  check(
    'the claim is registered as a second case type',
    templates.map((t) => t.key).join(','),
    'eviction-petition,financial-claim',
  )

  const officeFields = allFields(claimTemplate as never).filter((f) => f.adminOnly)
  check('seven answers belong to the office', officeFields.length, 7)
  check(
    'and the court is one of them',
    officeFields.some((f) => f.name === 'court_name'),
    true,
  )

  const filled = {
    ...claimDefaults,
    claimant_name: 'شركة المثال التجارية شركة الشخص الواحد',
    claimant_entity_civil_no: '0000000',
    claimant_commercial_register: '000000',
    respondent_name: 'فلان عبد الله الفلاني',
    respondent_civil_id: '000000000000',
    respondent_address: 'منطقة المثال – قطعة (1) – شارع (10)',
    amount: 7250,
    instruments: [
      {
        kind: 'cheque',
        number: '000123',
        date: '1/3/2026',
        bank: 'بنك المثال',
        returned: 'true',
        stamped: '',
        text: '',
        amount: 7250,
      },
    ],
  } as unknown as Record<string, unknown>

  const posted = submit(filled)
  const parsed = claimTemplate.schema.safeParse(posted)
  check(
    'a filled claim validates',
    parsed.success ? '' : parsed.error.issues.map((i) => i.path.join('.')).join(', '),
    '',
  )

  if (parsed.success) {
    const out = claimTemplate.derive(parsed.data, {}) as Record<
      string,
      string | boolean
    >
    check(
      'a cheque produces all four documents',
      out.documents,
      'صحيفة دعوى، تكليف بالوفاء، طلب استصدار أمر أداء، حافظة مستندات',
    )
    check('the demand is offered', out.include_demand, true)
    check('Article 166 is dropped', out.lawsuit_article_166, false)
    check(
      'the body survives the round trip intact',
      String(out.lawsuit_body).startsWith('ترتبط الطالبة بالمعلن إليه بعلاقة تجارية'),
      true,
    )
    check(
      'the cheque kept its bank through the JSON row',
      String(out.lawsuit_body).includes('المسحوب على بنك المثال'),
      true,
    )
    check(
      'and its bounce, which is a checkbox inside a row',
      String(out.lawsuit_body).includes('وقد رُدّ الشيك من البنك'),
      true,
    )
    check('the court level follows the amount', out.court_level, 'الكلية')
  }

  // an invoice instead: two documents, and the Article 166 paragraph stays
  const invoicePosted = submit({
    ...filled,
    amount: 882.511,
    instruments: [
      {
        kind: 'invoice',
        number: '12345',
        date: '30/8/2025',
        bank: '',
        returned: '',
        stamped: 'true',
        text: '',
        amount: 0,
      },
    ],
  })
  const invoiceParsed = claimTemplate.schema.safeParse(invoicePosted)
  check('an invoice claim validates too', invoiceParsed.success, true)
  if (invoiceParsed.success) {
    const out = claimTemplate.derive(invoiceParsed.data, {}) as Record<string, unknown>
    check('two documents only', out.documents, 'صحيفة دعوى، حافظة مستندات')
    check('no payment order', out.include_order, false)
    check('Article 166 stays', out.lawsuit_article_166, true)
    check('the court drops a level', out.court_level, 'الجزئية')
  }

  /** where a bad answer lands */
  function errorPath(patch: Record<string, unknown>): string {
    const result = claimTemplate.schema.safeParse(submit({ ...filled, ...patch }))
    return result.success ? '' : result.error.issues[0].path.join('.')
  }

  check(
    'a company needs its commercial register',
    errorPath({ claimant_commercial_register: '' }),
    'claimant_commercial_register',
  )
  check(
    'a person needs twelve digits',
    errorPath({ respondent_civil_id: '123' }),
    'respondent_civil_id',
  )
  check(
    'the address is required',
    errorPath({ respondent_address: '' }),
    'respondent_address',
  )
  check(
    'a claim needs at least one instrument',
    errorPath({ instruments: [] }),
    'instruments',
  )
  check(
    'a bad instrument date lands on that row',
    errorPath({
      instruments: [
        {
          kind: 'cheque',
          number: '1',
          date: 'أمس',
          bank: 'بنك',
          returned: '',
          stamped: '',
          text: '',
          amount: 0,
        },
      ],
    }),
    'instruments.0.date',
  )
  check(
    'and a row with no kind asks for one',
    errorPath({
      instruments: [
        {
          kind: '',
          number: '',
          date: '',
          bank: '',
          returned: '',
          stamped: '',
          text: '',
          amount: 0,
        },
      ],
    }),
    'instruments.0.kind',
  )
  check(
    'أخرى wants the client’s own words',
    errorPath({
      instruments: [
        {
          kind: 'other',
          number: '',
          date: '',
          bank: '',
          returned: '',
          stamped: '',
          text: '',
          amount: 0,
        },
      ],
    }),
    'instruments.0.text',
  )

  // the office's own answers reach the documents from the review screen
  const withOffice = claimTemplate.schema.safeParse({
    ...posted,
    court_name: 'الرقعي',
    demand_posted_on: '5/4/2026',
    order_number: '1234',
    order_year: '2026',
    order_refused_on: '20/4/2026',
  })
  check('the office answers validate', withOffice.success, true)
  if (withOffice.success) {
    const out = claimTemplate.derive(withOffice.data, {}) as Record<string, string>
    check(
      'and reach the صحيفة',
      out.lawsuit_body.includes('أمر الأداء رقم (1234/2026 أمر أداء كلي الرقعي)'),
      true,
    )
    check(
      'and the أمر أداء names the court',
      out.order_judge.includes('محكمة الرقعي الكلية'),
      true,
    )
  }

  // the lawyer can still overrule any composed paragraph
  const overridden = claimTemplate.derive(
    (parsed.success ? parsed.data : claimDefaults) as never,
    { lawsuit_requests: 'الطلبات كما كتبها المحامي' },
  ) as Record<string, string>
  check('an override wins', overridden.lawsuit_requests, 'الطلبات كما كتبها المحامي')
}

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
