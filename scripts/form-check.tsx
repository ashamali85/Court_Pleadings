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
import HintButton from '@/components/hint'
import { contentDefaults } from '@/lib/content/defaults'
import { templates } from '@/lib/templates'
import { claimTemplate } from '@/lib/templates/claim'
import {
  DEFENDANT,
  PARTY_SIDES,
  PARTY_TYPES,
  PLAINTIFF,
  PRIVATE_PARTY_TYPES,
  partySection,
} from '@/lib/templates/party'
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

  // the party questions are the shared ones now, checked once for every
  // template further down; what is checked here is this case type's own
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

// ---------- choosing a case type ----------
//
// The card shows the name and nothing else; the explanation lives behind the
// ؟ and comes from the content map, so the lawyer rewords it on /admin/content
// rather than in the code.
console.log('\n--- the case-type cards')
{
  const content = contentDefaults()

  for (const template of templates) {
    const explanation = content[`template.${template.key}.description`]
    check(
      `${template.key}: has an explanation to show`,
      Boolean(explanation && explanation.trim().length > 10),
      true,
    )
    check(
      `${template.key}: and the lawyer can edit it`,
      Object.keys(content).includes(`template.${template.key}.description`),
      true,
    )

    const closed = renderToStaticMarkup(
      <HintButton
        text={explanation}
        forLabel={content[`template.${template.key}.name`]}
        labelPrefix="شرح"
      />,
    )
    check(
      `${template.key}: the explanation is not printed on the card`,
      closed.includes(explanation),
      false,
    )
    check(`${template.key}: only the ؟ is`, closed.includes('؟'), true)
    check(
      `${template.key}: which says what it explains`,
      closed.includes(`aria-label="شرح ${content[`template.${template.key}.name`]}"`),
      true,
    )
    check(
      `${template.key}: and starts closed`,
      closed.includes('aria-expanded="false"'),
      true,
    )
  }
}

// ---------- a government body as the other side ----------
//
// A ministry has no civil card and no commercial register, and the address
// line stops calling it «المدعى عليه». The second half is a label that moves
// with another answer, which only rendering can show.
console.log('\n--- جهة حكومية')
{
  const evictionFields = allFields(evictionTemplate as never)
  const field = (name: string): FieldDef => {
    const found = evictionFields.find((f) => f.name === name)
    if (!found) throw new Error(`no field named ${name}`)
    return found
  }
  const draw = (name: string, values: Record<string, unknown>) =>
    renderToStaticMarkup(
      <Field
        field={field(name)}
        values={values}
        errors={{}}
        onChange={() => undefined}
      />,
    )

  const ministry = { defendant_type: 'government' }
  const person = { defendant_type: 'natural' }

  check(
    'جهة حكومية is offered to المدعى عليه',
    draw('defendant_type', {}).includes('جهة حكومية'),
    true,
  )
  check(
    'and to المدعي it is not',
    draw('plaintiff_type', {}).includes('جهة حكومية'),
    false,
  )
  check(
    'while المدعي keeps its other four',
    draw('plaintiff_type', {}).includes('رخصة فردية'),
    true,
  )
  check(
    'and has no entity-name field to orphan',
    allFields(evictionTemplate as never).some(
      (f) => f.name === 'plaintiff_government_name',
    ),
    false,
  )
  check(
    'choosing it asks for the entity name',
    draw('defendant_government_name', ministry).includes('اسم الجهة الحكومية'),
    true,
  )
  check(
    'and nobody else is asked for it',
    draw('defendant_government_name', person),
    '',
  )
  check(
    'a ministry is not asked for a civil card',
    draw('defendant_civil_id', ministry),
    '',
  )
  check('nor for a nationality', draw('defendant_nationality', ministry), '')
  check(
    'nor for a commercial register',
    draw('defendant_company_register', ministry),
    '',
  )

  check(
    'the address is normally the respondent’s',
    draw('defendant_address', person).includes('عنوان المدعى عليه'),
    true,
  )
  check(
    'and becomes the entity’s once a ministry is chosen',
    draw('defendant_address', ministry).includes('عنوان الجهة الحكومية'),
    true,
  )
  check(
    'without turning into a second field',
    draw('defendant_address', ministry).includes('عنوان المدعى عليه'),
    false,
  )
  check(
    'it is still the same input, holding the same value',
    draw('defendant_address', {
      ...ministry,
      defendant_address: 'العاصمة – قطعة (1)',
    }).includes('العاصمة – قطعة (1)'),
    true,
  )

  // and the lawyer can reword the alternative, like any other label
  const content = contentDefaults()
  check(
    'the alternative wording is on the content screen',
    content['field.eviction-petition.defendant_address.label.when1'],
    'عنوان الجهة الحكومية',
  )
  check(
    'so is the entity name field',
    content['field.eviction-petition.defendant_government_name.label'],
    'اسم الجهة الحكومية',
  )
}

// ---------- every pleading type asks about its parties identically ----------
//
// This is the rule the office asked for, enforced rather than remembered: a
// new صحيفة دعوى gets the same المدعي and المدعى عليه as every other one, with
// the same dropdowns and the same validation. A template that hand-rolls its
// own party fields, renames a key, reorders them or quietly drops one fails
// here — which is the point.
console.log('\n--- المدعي والمدعى عليه are the same in every pleading type')
{
  /** what a section must contain, exactly, before anything case-specific */
  const canonical = (side: typeof PLAINTIFF | typeof DEFENDANT) =>
    partySection(side).fields

  for (const template of templates) {
    for (const side of PARTY_SIDES) {
      const section = template.sections.find((s) => s.key === side.sectionKey)

      check(`${template.key}: has a ${side.labelAr} section`, Boolean(section), true)
      if (!section) continue

      check(
        `${template.key}/${side.sectionKey}: titled as the shared side is`,
        section.titleAr,
        side.labelAr,
      )

      const want = canonical(side)
      const got = section.fields.slice(0, want.length)

      check(
        `${template.key}/${side.sectionKey}: the same party fields, in order`,
        got.map((f) => f?.name).join(', '),
        want.map((f) => f.name).join(', '),
      )

      // identical names are not enough: a label, a width, a rule or an option
      // list could still have been changed in passing. Report the first field
      // that differs by name rather than printing two field definitions.
      const differing = want.find(
        (field, i) => JSON.stringify(got[i]) !== JSON.stringify(field),
      )
      check(
        `${template.key}/${side.sectionKey}: and each one defined identically`,
        differing ? `${differing.name} was changed` : 'identical',
        'identical',
      )

      // anything after the shared block is this case's own business, but it
      // may not be another party field wearing a different name
      const extra = section.fields.slice(want.length)
      check(
        `${template.key}/${side.sectionKey}: nothing of its own pretends to be a party field`,
        extra.every(
          (f) => !f.name.startsWith(`${side.prefix}_`) || f.name.endsWith('_address'),
        ),
        true,
      )
    }

    // and the two sides differ in exactly one respect, everywhere
    const pick = (sectionKey: string) =>
      template.sections
        .find((s) => s.key === sectionKey)
        ?.fields.find((f) => f.name.endsWith('_type'))
        ?.options?.map((o) => o.value) ?? []

    check(
      `${template.key}: المدعي is offered the private shapes`,
      pick('plaintiff').join(','),
      PRIVATE_PARTY_TYPES.join(','),
    )
    check(
      `${template.key}: المدعى عليه is offered those plus جهة حكومية`,
      pick('defendant').join(','),
      PARTY_TYPES.join(','),
    )
  }
}

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
