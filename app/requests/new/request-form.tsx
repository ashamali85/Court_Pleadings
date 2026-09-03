'use client'

import { useActionState } from 'react'
import { submitRequest, type RequestFormState } from '@/app/requests/actions'
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

      {sections.map((section) => (
        <div className="card" key={section.key}>
          <div className="section-title">{section.titleAr}</div>
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
        </div>
      ))}

      <div className="card">
        <div className="section-title">ملاحظات إضافية</div>
        <div className="field">
          <label htmlFor="clientNote">ملاحظات للمحامي (اختياري)</label>
          <textarea id="clientNote" name="clientNote" rows={3} />
        </div>
        <div className="actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
          </button>
          <span className="hint">
            بعد الإرسال يراجع المحامي البيانات ويصدر الصحيفة بصيغة Word.
          </span>
        </div>
      </div>
    </form>
  )
}
