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
import { blankInstrument } from '@/lib/claim/instruments'
import { claimTemplate } from '@/lib/templates/claim'
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

// ---------- the financial claim's form ----------
//
// This form hides more than it shows: the office's own answers never reach
// the client, and a row asks only what its kind needs. Both are decided at
// render time, so both are checked by rendering.
console.log('\n--- مطالبة مالية: what the client is actually shown')
{
  const claimFields = allFields(claimTemplate as never)
  const named = (name: string): FieldDef => {
    const field = claimFields.find((f) => f.name === name)
    if (!field) throw new Error(`no field named ${name}`)
    return field
  }

  // what RequestForm does: drop the office's fields, then drop empty sections
  const clientSections = claimTemplate.sections
    .map((s) => ({ ...s, fields: s.fields.filter((f) => !f.adminOnly) }))
    .filter((s) => s.fields.length > 0)

  check(
    'the office section disappears from the client form',
    clientSections.some((s) => s.key === 'office'),
    false,
  )
  check('four sections are left', clientSections.length, 4)
  check(
    'and none of them carries an office field',
    clientSections.flatMap((s) => s.fields).some((f) => f.adminOnly),
    false,
  )
  check('while the lawyer still gets all five', claimTemplate.sections.length, 5)

  const company = { claimant_kind: 'company' }
  const person = { claimant_kind: 'woman' }
  check(
    'a company is asked for its commercial register',
    renderToStaticMarkup(
      <Field
        field={named('claimant_commercial_register')}
        values={company}
        errors={{}}
        onChange={() => undefined}
      />,
    ).includes('السجل التجاري'),
    true,
  )
  check(
    'and not for a civil card',
    renderToStaticMarkup(
      <Field
        field={named('claimant_civil_id')}
        values={company}
        errors={{}}
        onChange={() => undefined}
      />,
    ),
    '',
  )
  check(
    'a person is asked the other way round',
    renderToStaticMarkup(
      <Field
        field={named('claimant_entity_civil_no')}
        values={person}
        errors={{}}
        onChange={() => undefined}
      />,
    ),
    '',
  )
  check(
    'the صفة select starts unchosen rather than guessing',
    shown(
      renderToStaticMarkup(
        <Field
          field={named('claimant_kind')}
          values={{}}
          errors={{}}
          onChange={() => undefined}
        />,
      ),
    ),
    '— اختر —',
  )

  /** the instrument rows, rendered with one row of the given kind */
  const rowHtml = (kind: string) =>
    renderToStaticMarkup(
      <Field
        field={named('instruments')}
        values={{ instruments: [{ ...blankInstrument(), kind }] }}
        errors={{}}
        onChange={() => undefined}
      />,
    )

  const chequeRow = rowHtml('cheque')
  check(
    'a cheque row asks for its bank',
    chequeRow.includes('البنك المسحوب عليه'),
    true,
  )
  check('and whether it bounced', chequeRow.includes('رُدّ الشيك من البنك'), true)
  check('but not about a stamp', chequeRow.includes('مذيّل بختم'), false)
  check('nor for free text', chequeRow.includes('وصف السند'), false)

  const invoiceRow = rowHtml('invoice')
  check('an invoice row asks about the stamp', invoiceRow.includes('مذيّل بختم'), true)
  check('and not about a bank', invoiceRow.includes('البنك المسحوب عليه'), false)

  const otherRow = rowHtml('other')
  check('أخرى asks only for the description', otherRow.includes('وصف السند'), true)
  check('and drops the number', otherRow.includes('الرقم'), false)

  const privateRow = rowHtml('private_acknowledgement')
  check('an إقرار عرفي has no number to give', privateRow.includes('الرقم'), false)
  check('but still has a date', privateRow.includes('التاريخ'), true)
}

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
