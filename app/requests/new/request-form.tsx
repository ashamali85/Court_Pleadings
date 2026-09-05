'use client'

import { useActionState } from 'react'
import type { RequestFormState } from '@/app/requests/actions'
import SectionCard from '@/components/collapsible'
import { Field, useFieldValues } from '@/components/fields'
import SubmitButton from '@/components/submit-button'
import type { SectionDef } from '@/lib/templates/types'

export type RequestFormAction = (
  state: RequestFormState,
  formData: FormData,
) => Promise<RequestFormState>

export default function RequestForm({
  action,
  templateKey,
  requestId,
  sections,
  defaults,
  clientNote,
  labels,
}: {
  action: RequestFormAction
  templateKey: string
  requestId?: string
  sections: SectionDef[]
  defaults: Record<string, unknown>
  clientNote?: string
  labels: {
    noteSection: string
    noteLabel: string
    submit: string
    loading: string
    submitHint: string
    needsFix: string
  }
}) {
  const [state, formAction] = useActionState<RequestFormState, FormData>(action, {})
  const { values, onChange } = useFieldValues({
    ...defaults,
    ...(state.values ?? {}),
  })
  const errors = state.errors ?? {}

  return (
    <form action={formAction}>
      <input type="hidden" name="templateKey" value={templateKey} />
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}

      {state.error ? <div className="alert error">{state.error}</div> : null}

      {sections.map((section) => {
        const hasError = section.fields.some((f) => Boolean(errors[f.name]))
        return (
          <SectionCard
            key={section.key}
            title={section.titleAr}
            hasError={hasError}
            errorLabel={labels.needsFix}
          >
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

      <SectionCard title={labels.noteSection}>
        <div className="field">
          <label htmlFor="clientNote">{labels.noteLabel}</label>
          <textarea
            id="clientNote"
            name="clientNote"
            rows={3}
            defaultValue={clientNote ?? ''}
          />
        </div>
      </SectionCard>

      <div className="card">
        <div className="actions">
          <SubmitButton loadingLabel={labels.loading}>{labels.submit}</SubmitButton>
          <span className="hint">{labels.submitHint}</span>
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
