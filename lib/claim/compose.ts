/**
 * The four documents of a financial claim, composed as text.
 *
 * Everything here is the office's own wording, taken from its approved output
 * (examples/build3_*.json) and its reference forms, with the variable parts
 * filled and every word of agreement adjusted. Nothing here knows about Word:
 * a document is a set of named paragraphs, which a renderer then lays out.
 * That split is what makes the legal wording testable — scripts/claim-check.ts
 * compares these paragraphs against the office's documents character by
 * character, which no screenshot of a .docx could do.
 *
 * The terminology rule is enforced structurally: each composer asks
 * `vocabulary()` for its own document, so the صحيفة cannot reach the word
 * «المدعى عليه» and the حافظة cannot reach «المعلن إليه».
 */
import { blankCase, formOf, relationshipText, type ClaimCase } from '@/lib/claim/case'
import { courtLevel, courtName } from '@/lib/claim/court'
import {
  domicile,
  honorific,
  nationalityPhrase,
  objectSuffix,
  pays,
  respectful,
  TRAILING_VERBS,
  trailingVerb,
  verb,
  VERBS,
  vocabulary,
  withBa,
  withLam,
  type PartyForm,
} from '@/lib/claim/grammar'
import {
  backReference,
  describeInstruments,
  dueFrom,
  exhibitDescription,
  hasCommercialPaper,
  instrumentWord,
} from '@/lib/claim/instruments'
import { moneyPhrase } from '@/lib/claim/money'
import { OFFICE } from '@/lib/claim/office'
import { longDateAr } from '@/lib/numerals'

/** a gap the lawyer fills in Word, where the office leaves one */
const GAP = '     '

const show = (value: string, fallback = GAP) => (value.trim() ? value.trim() : fallback)

/* --- the parties, as a line of text --------------------------------- */

/**
 * «السيد/ فلان – كويتي الجنسية – بطاقة مدنية رقم (000000000000)» for a person,
 * «شركة … – الرقم المدني للجهة (…) – رقم السجل التجاري (…)» for a company.
 */
export function partyLine(
  party: ClaimCase['claimant'],
  options: { honorific?: boolean; shortCivilId?: boolean } = {},
): string {
  const form = formOf(party.kind)
  const name = party.name.trim()

  if (party.kind === 'company') {
    return [
      name,
      party.entityCivilNo.trim()
        ? `الرقم المدني للجهة (${party.entityCivilNo.trim()})`
        : '',
      party.commercialRegister.trim()
        ? `رقم السجل التجاري (${party.commercialRegister.trim()})`
        : '',
    ]
      .filter(Boolean)
      .join(' – ')
  }

  const idLabel = options.shortCivilId ? 'ب.م.' : 'بطاقة مدنية رقم'
  const head = options.honorific === false ? name : `${honorific(form)}/ ${name}`
  return [
    head,
    nationalityPhrase(party.nationality, form),
    party.civilId.trim() ? `${idLabel} (${party.civilId.trim()})` : '',
  ]
    .filter(Boolean)
    .join(' – ')
}

/* --- صحيفة الدعوى ---------------------------------------------------- */

export type ComposedLawsuit = {
  /** the box at the top of the first page */
  subject: string
  amountFigures: string
  claimant: string
  respondent: string
  address: string
  /** «وكيل الطالبة» */
  agent: string
  /** «وأعلنته بالآتي:» */
  announced: string
  body: string[]
  /** the Article 166 paragraph is dropped once a payment order was tried */
  includeArticle166: boolean
  summons: string
  requests: string[]
}

export function composeLawsuit(claim: ClaimCase): ComposedLawsuit {
  const words = vocabulary('lawsuit')
  const cf = formOf(claim.claimant.kind)
  const rf = formOf(claim.respondent.kind)
  const claimant = words.claimant(cf)
  const respondent = words.respondent(rf)
  const money = moneyPhrase(claim.amount)
  const commercial = hasCommercialPaper(claim.instruments)
  const him = objectSuffix(rf)

  const subjectParagraph =
    `${verb(VERBS.relates, cf)} ${claimant} ${withBa(respondent)} ` +
    `${withBa(relationshipText(claim))}، و${verb(VERBS.isOwed, cf)} ${claimant} ` +
    `${respondent} بمبلغ مالي وقدره ${money} وذلك ثابت بموجب ` +
    `${describeInstruments(claim.instruments, respondent, 'subject')}.`

  const body = [subjectParagraph]

  if (commercial) {
    // the route through articles 166/167: the demand was posted, the payment
    // order was applied for and refused, so the claim is admissible
    const level = courtLevel(claim.amount)
    const orderRef =
      `${show(claim.orderNumber)}/${show(claim.orderYear, String(new Date().getFullYear()))} ` +
      `أمر أداء ${level.orderAr} ${claim.courtName.trim()}`.trimEnd()

    body.push(
      `ولما ${verb(VERBS.was, rf)} ${respondent} قد ${trailingVerb(TRAILING_VERBS.abstained, rf)} ` +
        `بلا مبرر قانوني عن الوفاء بهذا الدين رغم التنبيه علي${him} بالسداد بموجب ` +
        `كتاب التكليف بالوفاء المرسل إلي${him} بالبعثة البريدية المسجلة بتاريخ ` +
        `(${show(longDateAr(claim.demandPostedOn))})، وحيث إن الدين ثابت بالكتابة بموجب ` +
        `${backReference(claim.instruments)}، ومعين المقدار فهو مبلغ من النقود معلوم ` +
        `مقداره وحال الأداء، فقد ${trailingVerb(TRAILING_VERBS.did, cf)} ${claimant} ` +
        `عملاً بنص المادتين (167،166) من قانون المرافعات المدنية والتجارية بتقديم طلب ` +
        `إلى القاضي المختص باستصدار أمر الأداء رقم (${orderRef}) إلا أنه جوبه بالرفض، ` +
        `ووقعه وختمه القاضي المختص بتاريخ ${show(longDateAr(claim.orderRefusedOn))} ` +
        `بما يفيد رفضه، بما أصبحت معه هذه الدعوى مقبولة شكلًا، وتكون مع ذلك ${claimant} ` +
        `قد ${trailingVerb(TRAILING_VERBS.followed, cf)} الطريق الذي رسمه القانون لرفعها.`,
      `ولما ${verb(VERBS.was, rf)} ${respondent} قد ${trailingVerb(TRAILING_VERBS.abstained, rf)} ` +
        `بلا مبرر قانوني عن الوفاء بهذا الدين رغم التنبيه علي${him} بالسداد.`,
    )
  } else {
    body.push(
      `ولما ${verb(VERBS.was, rf)} ${respondent} قد ${trailingVerb(TRAILING_VERBS.abstained, rf)} ` +
        `بلا مبرر قانوني عن الوفاء بهذا الدين، ولم يعد من اللازم تقديم تكليف بالوفاء ` +
        `أو أمر أداء، وبالتالي تكون الدعوى مقبولة شكلًا دون الحاجة لتلك الإجراءات، ` +
        `وقد تم إنذار${him} بالسداد.`,
    )
  }

  const interest = claim.legalInterest
    ? `، مع إلزام${him} بالفوائد القانونية بنسبة 7% من قيمة المديونية منذ تاريخ ` +
      `استحقاق الدين وحتى تمام الوفاء`
    : ''

  return {
    subject: `دعوى مطالبة مالية بمبلغ ${moneyFigures(claim.amount)} د.ك.`,
    amountFigures: moneyFigures(claim.amount),
    claimant: `${partyLine(claim.claimant)}. ${domicile(cf)}: ${OFFICE.domicile}`,
    respondent: partyLine(claim.respondent),
    address: claim.respondentAddress.trim(),
    agent: `وكيل ${words.claimant(cf, 'oblique')}`,
    announced: `وأعلنت${him} بالآتي:`,
    body,
    includeArticle166: !commercial,
    summons:
      `أنا مندوب الإعلان سالف الذكر قد أعلنت وسلمت ${respondent} صورة من هذه الصحيفة ` +
      `وكلفت${him} بالحضور أمام المحكمة (                    ) الكائن مقرها بـ` +
      `                                 (                    ) وذلك بجلستها التي ` +
      `ستنعقد علنًا بها في يوم (                 ) الموافق:    /    /` +
      `${new Date().getFullYear()} ابتداءً من الساعة التاسعة صباحًا وما بعدها، وذلك ` +
      `للمرافعة وسماع${him} الحكم بالآتي:`,
    requests: [
      'أولًا: بقبول الدعوى شكلًا.',
      `ثانيًا: وفي موضوع الدعوى: بإلزام ${respondent} بأن ${pays(rf)} ` +
        `${withLam(words.claimant(cf, 'oblique'))} مبلغًا وقدره ${money}${interest}، ` +
        `وبالمصروفات ومقابل أتعاب المحاماة الفعلية بحكم مشمول بالنفاذ المعجل طليقًا ` +
        `من قيد الكفالة.`,
    ],
  }
}

/** the figures only, as the top box writes them */
function moneyFigures(amount: number): string {
  return moneyPhrase(amount).split(' د.ك.')[0]
}

/* --- تكليف بالوفاء ---------------------------------------------------- */

export type ComposedDemand = {
  respondent: string
  address: string
  subject: string
  body: string[]
  final: string
  agent: string
}

export function composeDemand(claim: ClaimCase): ComposedDemand {
  const words = vocabulary('demand')
  const cf = formOf(claim.claimant.kind)
  const rf = formOf(claim.respondent.kind)
  const creditor = words.claimant(cf)
  const money = moneyPhrase(claim.amount)
  const name = claim.claimant.name.trim()

  return {
    respondent: `${partyLine(claim.respondent, { shortCivilId: true })}         ${respectful(rf)}`,
    address: `العنوان في: ${claim.respondentAddress.trim()}.`,
    subject: `الموضوع: مطالبة بمبلغ وقدره ${money} المستحق عليكم`,
    body: [
      `إشارة إلى الموضوع المنوّه عنه أعلاه، وإلى ` +
        `${describeInstruments(claim.instruments, words.respondent(rf), 'reference')} ` +
        `${dueFrom(claim.instruments)} عليكم لصالح ${name} وحيث أنكم قد تخلفتم عن ` +
        `سداد مبلغ ${money} المستحق عليكم.`,
      `لـذا فإننا بموجب هذا التكليف نكلفكم بأداء هذا المبلغ، المنشغلة به ذمتكم لصالح ` +
        `${creditor} ${cf === 'f' ? 'سالفة الذكر' : cf === 'pl' ? 'سالفي الذكر' : 'سالف الذكر'}، ` +
        `وحيث إن هذا المبلغ مستحق في ذمتكم، وبما أن ${creditor} قد ` +
        `${trailingVerb(TRAILING_VERBS.referred, cf)} لنا المطالبة لاتخاذ الإجراءات ` +
        `القانونية بشأنها ضدكم.`,
    ],
    final:
      `فإننا بموجب هذا الكتاب ننذركم ونكلفكم بسرعة سداد المديونية المستحقة عليكم ` +
      `وقدرها ${money} ${ourClientPhrase(cf)} ${name}، وذلك خلال عشرة أيام من تاريخ ` +
      `إرسال هذا الإخطار وهو التاريخ المثبت أعلاه سواء تم السداد بمقر ${creditor} أو ` +
      `بمكتب ${agentPronoun(cf)} ${OFFICE.payableAt} وإلا سنضطر – آسفين – إلى اتخاذ ` +
      `كـــــافة الإجراءات القانونية ضدكم مع تحميلكم كافة الرسوم والمصاريف القضائية ` +
      `وأتعاب المحاماة، وما يستحق عليكم من تعويضات نتيجة تأخركم في السداد.`,
    agent: `وكيل ${words.claimant(cf, 'oblique')}`,
  }
}

const ourClientPhrase = (form: PartyForm) =>
  form === 'f' ? 'لموكلتنا' : form === 'pl' ? 'لموكلينا' : 'لموكلنا'

const agentPronoun = (form: PartyForm) =>
  form === 'f' ? 'وكيلها' : form === 'pl' ? 'وكيلهم' : 'وكيله'

/* --- طلب استصدار أمر أداء --------------------------------------------- */

export type ComposedOrder = {
  judge: string
  applicant: string
  applicantLabel: string
  respondent: string
  respondentLabel: string
  address: string
  body: string[]
  prayer: string
  agent: string
  /** the draft order the judge signs */
  decree: {
    ministry: string
    court: string
    inTheNameOf: string
    number: string
    weAre: string
    recital: string
    order: string
    signature: string
  }
}

export function composeOrder(claim: ClaimCase): ComposedOrder {
  const words = vocabulary('order')
  const cf = formOf(claim.claimant.kind)
  const rf = formOf(claim.respondent.kind)
  const applicant = words.claimant(cf)
  const against = words.respondent(rf)
  const level = courtLevel(claim.amount)
  const court = courtName(claim.courtName, claim.amount)
  const money = moneyPhrase(claim.amount)
  const him = objectSuffix(rf)
  const year = new Date().getFullYear()

  return {
    judge: `السيد/ قاضي ${court}      المحترم`,
    applicant:
      `${partyLine(claim.claimant, { honorific: false })} وعنوان` +
      `${cf === 'f' ? 'ها' : cf === 'pl' ? 'هم' : 'ه'}: ` +
      `${show(claim.claimantAddress, '')} العنوان الالكتروني – تطبيق هويتي: ` +
      `${claim.claimantEmail.trim()}`,
    applicantLabel: `(${words.headingClaimant(cf)})`,
    respondent: `${partyLine(claim.respondent)}    ${respectful(rf)}`,
    respondentLabel: `(${words.headingRespondent(rf)})`,
    address: `العنوان في: ${claim.respondentAddress.trim()}.`,
    body: [
      `${verb(VERBS.isOwed, cf)} ${applicant} ${against} بمبلغ وقدره ${money} ثابتة ` +
        `بموجب ${describeInstruments(claim.instruments, against, 'reference')}.`,
      `ولما ${verb(VERBS.was, rf)} ${against} قد ${trailingVerb(TRAILING_VERBS.abstained, rf)} بلا مبرر ` +
        `قانوني عن الوفاء بهذا الدين رغم التنبيه علي${him} بالسداد بموجب كتاب التكليف ` +
        `بالوفاء المرسل إلي${him} بالبعثة البريدية المسجلة بتاريخ ` +
        `${show(longDateAr(claim.demandPostedOn))} وحيث إن الدين ثابت بالكتابة بموجب ` +
        `${backReference(claim.instruments)}، ومعين المقدار فهو مبلغ من النقود معلوم ` +
        `مقداره وحال الأداء، الأمر الذي يحق معه ${withLam(applicant)} عملاً بنص ` +
        `المادتين (167،166) من قانون المرافعات المدنية والتجارية استصدار أمر الأداء ` +
        `بإلزام ${against} بسداد تلك المديونية.`,
    ],
    prayer:
      `${verb(VERBS.prays, cf)} ${applicant}، بعد الاطلاع على هذا الطلب والمستندات ` +
      `المرفقة ومواد القانون، إصدار أمركم بإلزام ${against} بأن ${pays(rf)} ` +
      `${withLam(applicant)} مبلغاً وقدره ${money}، مع إلزام${him} بالمصروفات وشمول ` +
      `الأمر بالنفاذ المعجل بلا كفالة.`,
    agent: `وكيل ${words.claimant(cf, 'oblique')}`,
    decree: {
      ministry: 'وزارة العدل',
      court: `المحكمة ${level.courtAr}`,
      inTheNameOf: 'باسم صاحب السمو أمير البلاد',
      number: `أمر أداء رقم (${GAP}) لسنة ${year}م ${level.orderAr}`,
      weAre: `نحـــــن:                                    قاضي ${court}`,
      recital:
        'بعد الاطلاع على هذا الطلب، وعلى المستندات المرفقة، وعملا بنص المادتين ' +
        '(166،167) من قانون المرافعات المدنية والتجارية.',
      order:
        `نأمر: بإلزام ${against}/ ${partyLine(claim.respondent, { honorific: false })} ` +
        `بأن ${pays(rf)} ${withLam(applicant)}/ ${claim.claimant.name.trim()}، مبلغاً ` +
        `وقدره ${money} والمصروفات، مع شمول الأمر بالنفاذ المعجل بلا كفالة.`,
      signature: `قاضي ${court}`,
    },
  }
}

/* --- حافظة المستندات -------------------------------------------------- */

export type ExhibitRow = {
  /** d/m/yyyy, blank when the document carries no date */
  date: string
  /** filled from the attachment once it is uploaded */
  pages: number | null
  description: string
}

export type ComposedExhibits = {
  from: string
  fromLabel: string
  to: string
  toLabel: string
  rows: ExhibitRow[]
  total: string
  signature: string
}

export function composeExhibits(claim: ClaimCase): ComposedExhibits {
  const words = vocabulary('exhibits')
  const cf = formOf(claim.claimant.kind)
  const rf = formOf(claim.respondent.kind)
  const respondent = words.respondent(rf)

  const rows: ExhibitRow[] = claim.instruments.map((instrument) => ({
    date: instrument.date.trim(),
    pages: null,
    description: exhibitDescription(instrument),
  }))

  // which document proves who the other side is depends on what they are
  if (claim.respondent.kind === 'company') {
    // «عقد تأسيس الشركة المدعى عليها» — the exhibit list names the company
    const company = `الشركة ${respondent}`
    rows.push(
      { date: '', pages: null, description: `صورة ضوئية من (عقد تأسيس ${company})` },
      {
        date: '',
        pages: null,
        description: `صورة ضوئية من (الرخصة التجارية ${withLam(company)})`,
      },
    )
  } else {
    const card = rf === 'pl' ? 'البطاقات المدنية' : 'البطاقة المدنية'
    rows.push({
      date: '',
      pages: null,
      description: `صورة ضوئية من (${card} ${withLam(respondent)})`,
    })
  }

  if (claim.hasContract) {
    rows.push({
      date: '',
      pages: null,
      description: `صورة ضوئية من العقد المبرم بين ${words.claimant(cf)} و${respondent}`,
    })
  }

  return {
    from: claim.claimant.name.trim(),
    fromLabel: words.claimant(cf),
    to: claim.respondent.name.trim(),
    toLabel: respondent,
    rows,
    total: exhibitTotal(rows),
    signature: `وكيل ${words.claimant(cf, 'oblique')}                                               المحامي/ ${OFFICE.lawyerShortName}`,
  }
}

/** «المجموع عدد (2) مستندات تتكون من (2) ورقات» */
export function exhibitTotal(rows: ExhibitRow[]): string {
  const counted = rows.filter((row) => row.pages !== null)
  const pages = counted.reduce((sum, row) => sum + (row.pages ?? 0), 0)
  // the page count comes from the attachments; until they are there it is a
  // gap the lawyer fills, not a zero that reads like an answer
  const shown = counted.length === rows.length ? String(pages) : '   '
  return `المجموع عدد (${rows.length}) مستندات تتكون من (${shown}) ورقات`
}

/** convenience for the tests and for a future preview screen */
export function composeAll(claim: ClaimCase = blankCase()) {
  return {
    lawsuit: composeLawsuit(claim),
    demand: composeDemand(claim),
    order: composeOrder(claim),
    exhibits: composeExhibits(claim),
    instrumentWord: instrumentWord(claim.instruments),
  }
}
