'use client'

import { useActionState } from 'react'
import { submitRequest, type RequestFormState } from '@/app/requests/actions'
import SectionCard from '@/components/collapsible'
import { Field, useFieldValues } from '@/components/fields'
import type { SectionDef } from '@/lib/templates/types'

export default function RequestForm({
  templateKey,
  sections,
  defaults,
}: {
  templateKey: string
  sections: SectionDef[]
  defaults: Record<string, unknown>
}) {
  const [state, action, pending] = useActionState<RequestFormState, FormData>(
    submitRequest,
    {},
  )
  const { values, onChange } = useFieldValues({ ...defaults, ...(state.values ?? {}) })
  const errors = state.errors ?? {}

  return (
    <form action={action}>
      <input type="hidden" name="templateKey" value={templateKey} />

      {state.error ? <div className="alert error">{state.error}</div> : null}

      {sections.map((section) => {
        const hasError = section.fields.some((f) => Boolean(errors[f.name]))
        return (
          <SectionCard key={section.key} title={section.titleAr} hasError={hasError}>
            {section.key === 'arrears' ? (
              <>
                <Field
                  field={section.fields[0]}
                  values={values}
                  errors={errors}
                  onChange={onChange}
                />
                <div className="row">
                  {section.fields.slice(1).map((field) => (
                    <Field
                      key={field.name}
                      field={field}
                      values={values}
                      errors={errors}
                      onChange={onChange}
                    />
                  ))}
                </div>
              </>
            ) : (
              section.fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  values={values}
                  errors={errors}
                  onChange={onChange}
                />
              ))
            )}
          </SectionCard>
        )
      })}

      <SectionCard title="ملاحظات إضافية">
        <div className="field">
          <label htmlFor="clientNote">ملاحظات للمحامي (اختياري)</label>
          <textarea id="clientNote" name="clientNote" rows={3} />
        </div>
      </SectionCard>

      <div className="card">
        <div className="actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
          </button>
          <span className="hint">
            بعد الإرسال يراجع المحامي البيانات ويصدر الصحيفة بصيغة Word.
          </span>
        </div>
        {state.error ? (
          <div className="alert error" style={{ marginTop: 16, marginBottom: 0 }}>
            {state.error}
          </div>
        ) : null}
      </div>
    </form>
  )
}
