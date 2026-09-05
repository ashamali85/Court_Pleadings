'use client'

import { useActionState, useRef } from 'react'
import { rejectRequest, submitReview, type ReviewState } from '@/app/admin/actions'
import SectionCard, { Accordion } from '@/components/collapsible'
import { Field, useFieldValues } from '@/components/fields'
import SubmitButton from '@/components/submit-button'
import type { SectionDef } from '@/lib/templates/types'

const PREVIEW_ORDER: { key: string; labelAr: string }[] = [
  { key: 'lease_date_phrase', labelAr: 'عبارة تاريخ العقد' },
  { key: 'monthly_rent_words', labelAr: 'الأجرة الشهرية (كتابةً)' },
  { key: 'nonpayment_start_date', labelAr: 'تاريخ بدء الامتناع' },
  { key: 'arrears_months_count', labelAr: 'عدد الأشهر' },
  { key: 'arrears_months_list', labelAr: 'الأشهر المطالب بها' },
  { key: 'arrears_total', labelAr: 'إجمالي المتأخر (رقماً)' },
  { key: 'arrears_total_words', labelAr: 'إجمالي المتأخر (كتابةً)' },
  { key: 'benefit_start_date', labelAr: 'بدء مقابل الانتفاع' },
  { key: 'penalty_amount_words', labelAr: 'الشرط الجزائي (كتابةً)' },
  { key: 'ordinal_eviction', labelAr: 'ترتيب طلب الإخلاء' },
  { key: 'ordinal_arrears', labelAr: 'ترتيب طلب الأجرة' },
  { key: 'ordinal_penalty', labelAr: 'ترتيب الشرط الجزائي' },
  { key: 'ordinal_costs', labelAr: 'ترتيب المصروفات' },
]

export default function ReviewForm({
  requestId,
  sections,
  overridable,
  values: initialValues,
  overrides,
  lawyerNote,
  preview,
  labels,
}: {
  requestId: string
  sections: SectionDef[]
  overridable: { name: string; labelAr: string }[]
  values: Record<string, unknown>
  overrides: Record<string, string>
  lawyerNote: string
  preview: Record<string, string>
  labels: {
    computedTitle: string
    computedHint: string
    overrideTitle: string
    overrideHint: string
    noteTitle: string
    generate: string
    generateLoading: string
    save: string
    loading: string
    rejectTitle: string
    rejectReason: string
    reject: string
    download: string
    needsFix: string
  }
}) {
  const [state, action] = useActionState<ReviewState, FormData>(submitReview, {})
  const [rejectState, rejectAction] = useActionState<ReviewState, FormData>(
    rejectRequest,
    {},
  )
  const { values, onChange } = useFieldValues(initialValues)
  const errors = state.errors ?? {}

  // written directly to the DOM node on click, so the value is already in place
  // when the form serialises — a state update would land one render too late
  const intentRef = useRef<HTMLInputElement>(null)
  const setIntent = (intent: 'save' | 'generate') => {
    if (intentRef.current) intentRef.current.value = intent
  }

  const overrideCount = Object.keys(overrides).length

  const banner = state.ok ? (
    <div className="alert ok">
      {state.ok}{' '}
      {state.documentId ? (
        <a href={`/api/documents/${state.documentId}`}>
          {labels.download}
          {state.filename ? ` (${state.filename})` : ''}
        </a>
      ) : null}
    </div>
  ) : null

  return (
    // one accordion across the whole screen, including the reject card below,
    // so only ever one section is open
    <Accordion>
      <form action={action}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="intent" defaultValue="save" ref={intentRef} />

        {state.error ? <div className="alert error">{state.error}</div> : null}
        {banner}

        {sections.map((section) => {
          const hasError = section.fields.some((f) => Boolean(errors[f.name]))
          return (
            <SectionCard
              key={section.key}
              id={section.key}
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

        <SectionCard id="computed" title={labels.computedTitle}>
          <p className="muted">{labels.computedHint}</p>
          <dl className="kv">
            {PREVIEW_ORDER.filter((p) => preview[p.key]).map((p) => (
              <div key={p.key} style={{ display: 'contents' }}>
                <dt>{p.labelAr}</dt>
                <dd>{preview[p.key]}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard
          id="overrides"
          title={labels.overrideTitle}
          badge={overrideCount > 0 ? String(overrideCount) : undefined}
        >
          <p className="muted">{labels.overrideHint}</p>
          <div className="row">
            {overridable.map((item) => (
              <div className="field" key={item.name}>
                <label htmlFor={`override__${item.name}`}>{item.labelAr}</label>
                <input
                  id={`override__${item.name}`}
                  name={`override__${item.name}`}
                  type="text"
                  defaultValue={overrides[item.name] ?? ''}
                  placeholder={preview[item.name] ?? ''}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="card">
          <div className="section-title">{labels.noteTitle}</div>
          <div className="field">
            <textarea name="lawyerNote" rows={3} defaultValue={lawyerNote} />
          </div>
          <div className="actions">
            <SubmitButton
              loadingLabel={labels.generateLoading}
              onClick={() => setIntent('generate')}
            >
              {labels.generate}
            </SubmitButton>
            <SubmitButton
              className="btn secondary"
              loadingLabel={labels.loading}
              onClick={() => setIntent('save')}
            >
              {labels.save}
            </SubmitButton>
          </div>

          {/* repeated here: the banner at the top of a long form is easy to miss */}
          {state.error ? (
            <div className="alert error" style={{ marginTop: 16, marginBottom: 0 }}>
              {state.error}
            </div>
          ) : null}
          {state.ok && state.documentId ? (
            <div className="alert ok" style={{ marginTop: 16, marginBottom: 0 }}>
              {state.ok}{' '}
              <a href={`/api/documents/${state.documentId}`}>{labels.download}</a>
            </div>
          ) : null}
        </div>
      </form>

      <SectionCard
        id="reject"
        title={labels.rejectTitle}
        hasError={Boolean(rejectState.error)}
      >
        <form action={rejectAction}>
          <input type="hidden" name="requestId" value={requestId} />
          {rejectState.error ? (
            <div className="alert error">{rejectState.error}</div>
          ) : null}
          {rejectState.ok ? <div className="alert ok">{rejectState.ok}</div> : null}
          <div className="field">
            <label htmlFor="rejectionReason">{labels.rejectReason}</label>
            <textarea id="rejectionReason" name="rejectionReason" rows={3} required />
          </div>
          <SubmitButton className="btn danger" loadingLabel={labels.loading}>
            {labels.reject}
          </SubmitButton>
        </form>
      </SectionCard>
    </Accordion>
  )
}
