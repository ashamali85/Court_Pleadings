/**
 * Nationalities, as they are written in a Kuwaiti pleading: the masculine
 * adjective (كويتي، هندي، صومالي)، not the country name.
 *
 * The stored value is the ISO 3166-1 alpha-2 code, so the admin can reword a
 * label on the content screen without orphaning data already submitted.
 * `STATELESS` is not an ISO code — it is here because «بدون» appears often
 * enough in Kuwaiti practice to be worth a first-class option.
 *
 * Order: Kuwait, then the GCC, then the rest of the Arab states, then everyone
 * else collated in Arabic. A Kuwaiti client finds their own nationality first
 * and does not scroll for the neighbours.
 */

export type Nationality = { value: string; labelAr: string }

/** not an ISO code; «بدون» is common enough in Kuwait to be a real option */
export const STATELESS = 'STATELESS'

const GCC: Nationality[] = [
  { value: 'KW', labelAr: 'كويتي' },
  { value: 'SA', labelAr: 'سعودي' },
  { value: 'AE', labelAr: 'إماراتي' },
  { value: 'QA', labelAr: 'قطري' },
  { value: 'BH', labelAr: 'بحريني' },
  { value: 'OM', labelAr: 'عُماني' },
]

const ARAB: Nationality[] = [
  { value: 'JO', labelAr: 'أردني' },
  { value: 'SY', labelAr: 'سوري' },
  { value: 'LB', labelAr: 'لبناني' },
  { value: 'IQ', labelAr: 'عراقي' },
  { value: 'YE', labelAr: 'يمني' },
  { value: 'PS', labelAr: 'فلسطيني' },
  { value: 'EG', labelAr: 'مصري' },
  { value: 'SD', labelAr: 'سوداني' },
  { value: 'LY', labelAr: 'ليبي' },
  { value: 'TN', labelAr: 'تونسي' },
  { value: 'DZ', labelAr: 'جزائري' },
  { value: 'MA', labelAr: 'مغربي' },
  { value: 'MR', labelAr: 'موريتاني' },
  { value: 'SO', labelAr: 'صومالي' },
  { value: 'DJ', labelAr: 'جيبوتي' },
  { value: 'KM', labelAr: 'قمري' },
]

/** Everyone else. Sorted at module load with Arabic collation, not by hand. */
const REST: Nationality[] = [
  { value: 'AF', labelAr: 'أفغاني' },
  { value: 'AL', labelAr: 'ألباني' },
  { value: 'AD', labelAr: 'أندوري' },
  { value: 'AO', labelAr: 'أنغولي' },
  { value: 'AG', labelAr: 'أنتيغوي' },
  { value: 'AR', labelAr: 'أرجنتيني' },
  { value: 'AM', labelAr: 'أرمني' },
  { value: 'AU', labelAr: 'أسترالي' },
  { value: 'AT', labelAr: 'نمساوي' },
  { value: 'AZ', labelAr: 'أذربيجاني' },
  { value: 'BS', labelAr: 'باهامي' },
  { value: 'BD', labelAr: 'بنغلاديشي' },
  { value: 'BB', labelAr: 'بربادوسي' },
  { value: 'BY', labelAr: 'بيلاروسي' },
  { value: 'BE', labelAr: 'بلجيكي' },
  { value: 'BZ', labelAr: 'بليزي' },
  { value: 'BJ', labelAr: 'بنيني' },
  { value: 'BT', labelAr: 'بوتاني' },
  { value: 'BO', labelAr: 'بوليفي' },
  { value: 'BA', labelAr: 'بوسني' },
  { value: 'BW', labelAr: 'بوتسواني' },
  { value: 'BR', labelAr: 'برازيلي' },
  { value: 'BN', labelAr: 'بروني' },
  { value: 'BG', labelAr: 'بلغاري' },
  { value: 'BF', labelAr: 'بوركيني' },
  { value: 'BI', labelAr: 'بوروندي' },
  { value: 'CV', labelAr: 'كاب فيردي' },
  { value: 'KH', labelAr: 'كمبودي' },
  { value: 'CM', labelAr: 'كاميروني' },
  { value: 'CA', labelAr: 'كندي' },
  { value: 'CF', labelAr: 'أفريقي وسطي' },
  { value: 'TD', labelAr: 'تشادي' },
  { value: 'CL', labelAr: 'تشيلي' },
  { value: 'CN', labelAr: 'صيني' },
  { value: 'CO', labelAr: 'كولومبي' },
  { value: 'CG', labelAr: 'كونغولي' },
  { value: 'CD', labelAr: 'كونغولي (جمهورية الكونغو الديمقراطية)' },
  { value: 'CR', labelAr: 'كوستاريكي' },
  { value: 'CI', labelAr: 'إيفواري' },
  { value: 'HR', labelAr: 'كرواتي' },
  { value: 'CU', labelAr: 'كوبي' },
  { value: 'CY', labelAr: 'قبرصي' },
  { value: 'CZ', labelAr: 'تشيكي' },
  { value: 'DK', labelAr: 'دنماركي' },
  { value: 'DM', labelAr: 'دومينيكي' },
  { value: 'DO', labelAr: 'دومينيكاني' },
  { value: 'EC', labelAr: 'إكوادوري' },
  { value: 'SV', labelAr: 'سلفادوري' },
  { value: 'GQ', labelAr: 'غيني استوائي' },
  { value: 'ER', labelAr: 'إريتري' },
  { value: 'EE', labelAr: 'إستوني' },
  { value: 'SZ', labelAr: 'إسواتيني' },
  { value: 'ET', labelAr: 'إثيوبي' },
  { value: 'FJ', labelAr: 'فيجي' },
  { value: 'FI', labelAr: 'فنلندي' },
  { value: 'FR', labelAr: 'فرنسي' },
  { value: 'GA', labelAr: 'غابوني' },
  { value: 'GM', labelAr: 'غامبي' },
  { value: 'GE', labelAr: 'جورجي' },
  { value: 'DE', labelAr: 'ألماني' },
  { value: 'GH', labelAr: 'غاني' },
  { value: 'GR', labelAr: 'يوناني' },
  { value: 'GD', labelAr: 'غرينادي' },
  { value: 'GT', labelAr: 'غواتيمالي' },
  { value: 'GN', labelAr: 'غيني' },
  { value: 'GW', labelAr: 'غيني بيساوي' },
  { value: 'GY', labelAr: 'غياني' },
  { value: 'HT', labelAr: 'هايتي' },
  { value: 'HN', labelAr: 'هندوراسي' },
  { value: 'HU', labelAr: 'مجري' },
  { value: 'IS', labelAr: 'آيسلندي' },
  { value: 'IN', labelAr: 'هندي' },
  { value: 'ID', labelAr: 'إندونيسي' },
  { value: 'IR', labelAr: 'إيراني' },
  { value: 'IE', labelAr: 'إيرلندي' },
  { value: 'IT', labelAr: 'إيطالي' },
  { value: 'JM', labelAr: 'جامايكي' },
  { value: 'JP', labelAr: 'ياباني' },
  { value: 'KZ', labelAr: 'كازاخستاني' },
  { value: 'KE', labelAr: 'كيني' },
  { value: 'KI', labelAr: 'كيريباتي' },
  { value: 'KR', labelAr: 'كوري جنوبي' },
  { value: 'KP', labelAr: 'كوري شمالي' },
  { value: 'KG', labelAr: 'قيرغيزي' },
  { value: 'LA', labelAr: 'لاوسي' },
  { value: 'LV', labelAr: 'لاتفي' },
  { value: 'LS', labelAr: 'ليسوتي' },
  { value: 'LR', labelAr: 'ليبيري' },
  { value: 'LI', labelAr: 'ليختنشتايني' },
  { value: 'LT', labelAr: 'ليتواني' },
  { value: 'LU', labelAr: 'لوكسمبورغي' },
  { value: 'MG', labelAr: 'مدغشقري' },
  { value: 'MW', labelAr: 'ملاوي' },
  { value: 'MY', labelAr: 'ماليزي' },
  { value: 'MV', labelAr: 'مالديفي' },
  { value: 'ML', labelAr: 'مالي' },
  { value: 'MT', labelAr: 'مالطي' },
  { value: 'MH', labelAr: 'مارشالي' },
  { value: 'MU', labelAr: 'موريشي' },
  { value: 'MX', labelAr: 'مكسيكي' },
  { value: 'FM', labelAr: 'ميكرونيزي' },
  { value: 'MD', labelAr: 'مولدوفي' },
  { value: 'MC', labelAr: 'موناكي' },
  { value: 'MN', labelAr: 'منغولي' },
  { value: 'ME', labelAr: 'مونتينيغري' },
  { value: 'MZ', labelAr: 'موزمبيقي' },
  { value: 'MM', labelAr: 'ميانماري' },
  { value: 'NA', labelAr: 'ناميبي' },
  { value: 'NR', labelAr: 'ناوروي' },
  { value: 'NP', labelAr: 'نيبالي' },
  { value: 'NL', labelAr: 'هولندي' },
  { value: 'NZ', labelAr: 'نيوزيلندي' },
  { value: 'NI', labelAr: 'نيكاراغوي' },
  { value: 'NE', labelAr: 'نيجري' },
  { value: 'NG', labelAr: 'نيجيري' },
  { value: 'MK', labelAr: 'مقدوني' },
  { value: 'NO', labelAr: 'نرويجي' },
  { value: 'PK', labelAr: 'باكستاني' },
  { value: 'PW', labelAr: 'بالاوي' },
  { value: 'PA', labelAr: 'بنمي' },
  { value: 'PG', labelAr: 'بابوا غيني' },
  { value: 'PY', labelAr: 'باراغواني' },
  { value: 'PE', labelAr: 'بيروفي' },
  { value: 'PH', labelAr: 'فلبيني' },
  { value: 'PL', labelAr: 'بولندي' },
  { value: 'PT', labelAr: 'برتغالي' },
  { value: 'RO', labelAr: 'روماني' },
  { value: 'RU', labelAr: 'روسي' },
  { value: 'RW', labelAr: 'رواندي' },
  { value: 'KN', labelAr: 'سانت كيتس ونيفيس' },
  { value: 'LC', labelAr: 'سانت لوسي' },
  { value: 'VC', labelAr: 'سانت فنسنت والغرينادين' },
  { value: 'WS', labelAr: 'ساموي' },
  { value: 'SM', labelAr: 'سان ماريني' },
  { value: 'ST', labelAr: 'ساو تومي وبرينسيبي' },
  { value: 'SN', labelAr: 'سنغالي' },
  { value: 'RS', labelAr: 'صربي' },
  { value: 'SC', labelAr: 'سيشيلي' },
  { value: 'SL', labelAr: 'سيراليوني' },
  { value: 'SG', labelAr: 'سنغافوري' },
  { value: 'SK', labelAr: 'سلوفاكي' },
  { value: 'SI', labelAr: 'سلوفيني' },
  { value: 'SB', labelAr: 'جزر سليمان' },
  { value: 'ZA', labelAr: 'جنوب أفريقي' },
  { value: 'SS', labelAr: 'جنوب سوداني' },
  { value: 'ES', labelAr: 'إسباني' },
  { value: 'LK', labelAr: 'سريلانكي' },
  { value: 'SR', labelAr: 'سورينامي' },
  { value: 'SE', labelAr: 'سويدي' },
  { value: 'CH', labelAr: 'سويسري' },
  { value: 'TW', labelAr: 'تايواني' },
  { value: 'TJ', labelAr: 'طاجيكي' },
  { value: 'TZ', labelAr: 'تنزاني' },
  { value: 'TH', labelAr: 'تايلندي' },
  { value: 'TL', labelAr: 'تيموري' },
  { value: 'TG', labelAr: 'توغولي' },
  { value: 'TO', labelAr: 'تونغي' },
  { value: 'TT', labelAr: 'ترينيدادي' },
  { value: 'TR', labelAr: 'تركي' },
  { value: 'TM', labelAr: 'تركماني' },
  { value: 'TV', labelAr: 'توفالي' },
  { value: 'UG', labelAr: 'أوغندي' },
  { value: 'UA', labelAr: 'أوكراني' },
  { value: 'GB', labelAr: 'بريطاني' },
  { value: 'US', labelAr: 'أمريكي' },
  { value: 'UY', labelAr: 'أوروغواني' },
  { value: 'UZ', labelAr: 'أوزبكي' },
  { value: 'VU', labelAr: 'فانواتي' },
  { value: 'VA', labelAr: 'فاتيكاني' },
  { value: 'VE', labelAr: 'فنزويلي' },
  { value: 'VN', labelAr: 'فيتنامي' },
  { value: 'ZM', labelAr: 'زامبي' },
  { value: 'ZW', labelAr: 'زيمبابوي' },
]

const arabicCollator = new Intl.Collator('ar')

export const NATIONALITIES: Nationality[] = [
  ...GCC,
  ...ARAB,
  ...[...REST].sort((a, b) => arabicCollator.compare(a.labelAr, b.labelAr)),
  { value: STATELESS, labelAr: 'بدون جنسية' },
]

const BY_CODE = new Map(NATIONALITIES.map((n) => [n.value, n.labelAr]))

/** «كويتي» for KW. Falls back to the code so an unknown value is never silent. */
export function nationalityLabel(code: string): string {
  return BY_CODE.get(code) ?? code
}

export function isNationalityCode(code: string): boolean {
  return BY_CODE.has(code)
}

/**
 * The flag for an ISO code, served from public/flags. Emoji flags are not an
 * option: Windows ships no flag glyphs, so 🇰🇼 renders as the letters "KW" on
 * most of this office's clients. STATELESS has no country and so no flag.
 */
export function flagSrc(code: string): string | null {
  if (!isNationalityCode(code) || code === STATELESS) return null
  return `/flags/${code.toLowerCase()}.svg`
}
