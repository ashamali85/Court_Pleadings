/**
 * The office's own fixed text: the chosen domicile, the signature block and
 * the address the debtor may pay at.
 *
 * These are constants for now, deliberately in one place. They belong on the
 * content screen (lib/content/defaults.ts) so the office can reword them
 * without a deploy — that is a small follow-up, not a reason to scatter them
 * through the composer.
 */
export const OFFICE = {
  /** «وموطنها المختار: …» in the صحيفة */
  domicile:
    'شركة مكتب علي العريان وحمد الصراف للمحاماة والاستشارات القانونية ذ.م.م. ' +
    'شركة مهنية للمحاماة والكائنة في ضاحية صباح السالم – قطعة (1) – شارع (102) – ' +
    'أبراج العربيد – البرج رقم (4) – الدور (19) – العنوان الالكتروني info@saar.law',

  /** where the debt may be paid, named in the تكليف بالوفاء */
  payableAt:
    'شركة علي العريان وحمد الصراف للمحاماة والاستشارات القانونية شركة مهنية للمحاماة ذ.م.م. ' +
    'الكائن في: الكويت – ضاحية صباح السالم – قطعة (1) – شارع (102) – أبراج العربيد – ' +
    'بلوك (4) – الدور (19)، تلفون 95547066',

  lawyerName: 'علي محمود العريان',
  /** the exhibit list signs with the short form */
  lawyerShortName: 'علي العريان',
  barNumber: '5095',
  barGrade: 'دستورية وتمييز',
} as const
