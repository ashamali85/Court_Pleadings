'use client'

import { useState } from 'react'
import SectionCard, { Accordion } from '@/components/collapsible'
import { Field, FieldGrid, useFieldValues } from '@/components/fields'
import type { SectionDef } from '@/lib/templates/types'
import { visibleSections } from '@/lib/templates/visibility'

export type ContractFormLabels = {
  generate: string
  generating: string
  generateHint: string
  generated: string
  failed: string
  blank: string
  blankHint: string
  notStored: string
  needsFix: string
  fixFields: string
}

/**
 * The name the browser saves the file as, read from the response itself.
 *
 * The route sends `filename*=UTF-8''…` per §7, and `<a download>` needs the
 * decoded text. Anything unexpected falls back to a name rather than letting
 * the browser invent one from the URL, which would be `criminal-defense`.
 */
function filenameFrom(header: string | null, fallback: string): string {
  const match = header?.match(/filename\*=UTF-8''([^;]+)/i)
  if (!match) return fallback
  try {
    return decodeURIComponent(match[1])
  } catch {
    return fallback
  }
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // the object URL holds the whole file in memory until it is released
  URL.revokeObjectURL(url)
}

/**
 * عقد محاماة — the office fills this in and the Word file comes back.
 *
 * It posts JSON and downloads the response rather than submitting a form to a
 * server action: the deliverable is a file, and a server action cannot hand one
 * back without first storing it somewhere. Nothing is stored, which is what §4
 * asks for, so the bytes have to come back on the same request.
 */
export default function ContractForm({
  endpoint,
  sections,
  defaults,
  labels,
}: {
  endpoint: string
  sections: SectionDef[]
  defaults: Record<string, unknown>
  labels: ContractFormLabels
}) {
  const { values, onChange } = useFieldValues(defaults)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<'generate' | 'blank' | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(
    null,
  )

  const shown = visibleSections(sections, values, { includeAdminOnly: true })

  async function generate() {
    setBusy('generate')
    setNotice(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.status === 422 || response.status === 400) {
        const body = (await response.json()) as { errors?: Record<string, string> }
        const found = body.errors ?? {}
        // `_` is a message about the request as a whole, not about one field
        const { _: general, ...fields } = found
        setErrors(fields)
        setNotice({
          kind: 'error',
          text: general ?? labels.fixFields,
        })
        return
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          errors?: Record<string, string>
        } | null
        setNotice({ kind: 'error', text: body?.errors?._ ?? labels.failed })
        return
      }

      setErrors({})
      save(
        await response.blob(),
        filenameFrom(response.headers.get('Content-Disposition'), 'عقد محاماة.docx'),
      )
      setNotice({ kind: 'ok', text: labels.generated })
    } catch {
      setNotice({ kind: 'error', text: labels.failed })
    } finally {
      setBusy(null)
    }
  }

  /** the printable form: every value a yellow placeholder — §5 example D */
  async function blank() {
    setBusy('blank')
    setNotice(null)
    try {
      const response = await fetch(`${endpoint}?blank=1`)
      if (!response.ok) {
        setNotice({ kind: 'error', text: labels.failed })
        return
      }
      save(
        await response.blob(),
        filenameFrom(
          response.headers.get('Content-Disposition'),
          'عقد محاماة - نموذج فارغ.docx',
        ),
      )
    } catch {
      setNotice({ kind: 'error', text: labels.failed })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Accordion initialOpenId={shown[0]?.key ?? null}>
        {shown.map((section) => (
          <SectionCard
            key={section.key}
            id={section.key}
            title={section.titleAr}
            hasError={section.fields.some((f) => Boolean(errors[f.name]))}
            errorLabel={labels.needsFix}
          >
            <FieldGrid>
              {section.fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  values={values}
                  errors={errors}
                  onChange={onChange}
                />
              ))}
            </FieldGrid>
          </SectionCard>
        ))}
      </Accordion>

      <div className="card">
        {notice ? (
          <div className={`alert ${notice.kind === 'ok' ? 'ok' : 'error'}`}>
            {notice.text}
          </div>
        ) : null}

        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={generate}
            disabled={busy !== null}
          >
            {busy === 'generate' ? labels.generating : labels.generate}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={blank}
            disabled={busy !== null}
          >
            {labels.blank}
          </button>
          <span className="hint">{labels.generateHint}</span>
        </div>

        <p className="hint">{labels.blankHint}</p>
        <p className="hint">{labels.notStored}</p>
      </div>
    </>
  )
}
