/**
 * The nationality search, checked against the way a client actually types:
 * the country rather than the adjective, no hamza, no diacritics.
 *
 *   npx tsx scripts/search-check.ts
 */
import { searchOptions } from '@/lib/arabic-search'
import { NATIONALITIES } from '@/lib/nationalities'

let failures = 0

function first(query: string, expected: string) {
  const results = searchOptions(NATIONALITIES, query)
  const ok = results[0]?.labelAr === expected
  if (!ok) failures += 1
  const shown =
    results
      .slice(0, 3)
      .map((r) => r.labelAr)
      .join('، ') || '(لا شيء)'
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${query.padEnd(12)} -> ${shown}${ok ? '' : `   [expected ${expected}]`}`,
  )
}

function absent(query: string, unwanted: string) {
  const results = searchOptions(NATIONALITIES, query)
  const ok = !results.some((r) => r.labelAr === unwanted)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${query.padEnd(12)} must not offer ${unwanted}`)
}

console.log('--- the adjective, as the list stores it')
for (const [q, e] of [
  ['كويتي', 'كويتي'],
  ['كوي', 'كويتي'],
  ['هندي', 'هندي'],
  ['صومالي', 'صومالي'],
  ['فلبيني', 'فلبيني'],
  ['باكستاني', 'باكستاني'],
]) {
  first(q, e)
}

console.log('\n--- spelled without the hamza or the diacritic')
for (const [q, e] of [
  ['عماني', 'عُماني'],
  ['اردني', 'أردني'],
  ['ايطالي', 'إيطالي'],
  ['الماني', 'ألماني'],
  ['امريكي', 'أمريكي'],
]) {
  first(q, e)
}

console.log('\n--- the country, which is what people type')
for (const [q, e] of [
  ['الكويت', 'كويتي'],
  ['السعودية', 'سعودي'],
  ['الاردن', 'أردني'],
  ['العراق', 'عراقي'],
  ['الهند', 'هندي'],
  ['الفلبين', 'فلبيني'],
  ['مصر', 'مصري'],
  ['لبنان', 'لبناني'],
  ['سوريا', 'سوري'],
  ['المانيا', 'ألماني'],
  ['ايطاليا', 'إيطالي'],
  ['بريطانيا', 'بريطاني'],
  ['باكستان', 'باكستاني'],
  ['بنغلاديش', 'بنغلاديشي'],
  ['امريكا', 'أمريكي'],
  ['فرنسا', 'فرنسي'],
  ['كندا', 'كندي'],
  ['هولندا', 'هولندي'],
  ['الصين', 'صيني'],
  ['اليابان', 'ياباني'],
]) {
  first(q, e)
}

console.log('\n--- the code, and the option that is not a country')
first('KW', 'كويتي')
first('SO', 'صومالي')
first('بدون', 'بدون جنسية')

console.log('\n--- a near miss must stay out of the list')
absent('تشيلي', 'تشيكي')
absent('زززز', 'كويتي')

console.log('\n--- shape')
const all = searchOptions(NATIONALITIES, '')
console.log(`empty query returns all ${all.length}, starting ${all[0].labelAr}`)
if (all.length !== NATIONALITIES.length || all[0].value !== 'KW') failures += 1
if (searchOptions(NATIONALITIES, 'زززز').length !== 0) failures += 1

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
