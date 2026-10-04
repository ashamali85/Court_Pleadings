/**
 * What the form actually puts on the page for a given set of values.
 *
 * The bug this pins: a <select> whose value matches none of its options falls
 * back to displaying the first one, so a request stored before the صفة existed
 * opened with «شخص طبيعي» already showing while the field held nothing. The
 * only way to see that is to render it, so this renders it.
 *
 *   npx tsx scripts/form-check.tsx
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { Field } from '@/components/fields'
import { evictionDefaults, evictionTemplate } from '@/lib/templates/eviction'
import { allFields } from '@/lib/templates'
import type { FieldDef } from '@/lib/templates/types'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n      got ${actual}, expected ${expected}`}`,
  )
}

const fields = allFields(evictionTemplate as never)
const fieldNamed = (name: string): FieldDef => {
  const field = fields.find((f) => f.name === name)
  if (!field) throw new Error(`no field named ${name}`)
  return field
}

function render(name: string, values: Record<string, unknown>): string {
  return renderToStaticMarkup(
    <Field
      field={fieldNamed(name)}
      values={values}
      errors={{}}
      onChange={() => undefined}
    />,
  )
}

/** the label the browser would show in the closed select */
function shown(html: string): string {
  const options = [...html.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)]
  const selected = options.find((m) => m[1].includes('selected'))
  return (selected ?? options[0])?.[2] ?? ''
}

// ---------- a صفة nobody has chosen ----------
console.log('--- an unchosen صفة')
{
  // a request stored before the party types existed has no key for it at all
  const legacy = { plaintiff_name: 'ورثة حبيب محمد تقي بهبهاني' }
  const html = render('plaintiff_type', legacy)
  check('the select does not claim a type', shown(html), '— اختر —')
  check('and the four types are still offered', html.includes('شخص طبيعي'), true)

  check(
    'the stored line is rendered, so it can be seen and corrected',
    render('plaintiff_name', legacy).includes('ورثة حبيب محمد تقي بهبهاني'),
    true,
  )
}

// ---------- the same for شكل الشركة, which also starts empty ----------
console.log('\n--- an unchosen شكل الشركة')
{
  const values = { ...evictionDefaults, plaintiff_type: 'company' }
  check(
    'does not claim a legal form',
    shown(render('plaintiff_company_form', values)),
    '— اختر —',
  )
}

// ---------- a chosen value shows itself, and the placeholder is gone ----------
console.log('\n--- once a value is held')
{
  const html = render('plaintiff_type', { plaintiff_type: 'licence' })
  check('the select shows what it holds', shown(html), 'رخصة فردية')
  check('and the placeholder cannot be chosen back', html.includes('— اختر —'), false)

  check(
    'the legacy line is gone from the form',
    render('plaintiff_name', { plaintiff_type: 'licence' }),
    '',
  )
}

// ---------- selects that do hold a default are untouched ----------
console.log('\n--- selects with a real default')
{
  check('نوع العين المؤجرة', shown(render('premises_lead', evictionDefaults)), 'شقة')
  check('من شهر', shown(render('arrears_from_month', evictionDefaults)), '1')
}

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
