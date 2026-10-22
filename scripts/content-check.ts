/**
 * Every piece of wording the screens ask for exists.
 *
 * `t('admin.jobs.title')` falls back to printing the key itself when nothing
 * defines it, which ships to the lawyer as `admin.jobs.title` sitting where a
 * heading should be. Nothing else catches that: it type-checks, it renders,
 * and it only looks wrong to someone who reads Arabic.
 *
 * So this reads the source for every literal key the app asks for and checks
 * the content map against it, in both directions.
 *
 *   npx tsx scripts/content-check.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { contentDefaults } from '@/lib/content/defaults'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n      got ${actual}, expected ${expected}`}`,
  )
}

/** every .ts/.tsx under these roots */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) sources(path, out)
    else if (/\.tsx?$/.test(entry)) out.push(path)
  }
  return out
}

const files = [...sources('app'), ...sources('components'), ...sources('lib')]

/** `t('some.key')` — only literals, since a computed key cannot be checked */
const ASKED = /\bt\(\s*'([a-z][\w.]*)'/gi

const asked = new Map<string, string>()
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(ASKED)) {
    if (!asked.has(match[1])) asked.set(match[1], file)
  }
}

const defined = contentDefaults()

console.log(`--- ${asked.size} keys asked for across ${files.length} files`)

const missing = [...asked].filter(([key]) => !(key in defined))
check(
  'every key a screen asks for has wording',
  missing.map(([key, file]) => `${key} (${file})`).join(', '),
  '',
)

/*
 * The other direction is a warning, not a failure: a key can legitimately be
 * defined and reached indirectly — status badges are `status.${r.status}`,
 * field labels are built from the template — so this only lists them.
 */
const unused = Object.keys(defined).filter(
  (key) =>
    !asked.has(key) &&
    !/^(field|section|override|template|status)\./.test(key) &&
    !files.some((file) => readFileSync(file, 'utf8').includes(key)),
)
if (unused.length) {
  console.log(`\nnote: ${unused.length} key(s) defined but never asked for by name`)
  for (const key of unused.slice(0, 20)) console.log(`      ${key}`)
}

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
