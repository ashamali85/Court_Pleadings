'use client'

import { useActionState, useRef } from 'react'
import { rejectRequest, submitReview, type ReviewState } from '@/app/admin/actions'
import { Field, useFieldValues } from '@/components/fields'
import type { SectionDef } from '@/lib/templates/types'

const PREVIEW_ORDER: { key: string; labelAr: string }[] = [
  { key: 'lease_date_phrase', labelAr: 'عبارة تاريخ العقد' },
  { key: 'monthly_rent_words', labelAr: 'الأجرة الشهرية تفقيطاً' },
  { key: 'nonpayment_start_date', labelAr: 'تاريخ بدء الامتناع' },
  { key: 'arrears_months_count', labelAr: 'عدد الأشهر' },
  { key: 'arrears_months_list', labelAr: 'الأشهر المطالب بها' },
  { key: 'arrears_total', labelAr: 'إجمالي المتأخر (رقماً)' },
  { key: 'arrears_total_words', labelAr: 'إجمالي المتأخر تفقيطاً' },
  { key: 'benefit_start_date', labelAr: 'بدء مقابل الانتفاع' },
  { key: 'penalty_amount_words', labelAr: 'الشرط الجزائي تفقيطاً' },
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
}: {
  requestId: string
  sections: SectionDef[]
  overridable: { name: string; labelAr: string }[]
  values: Record<string, unknown>
  overrides: Record<string, string>
  lawyerNote: string
  preview: Record<string, string>
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {})
  const { values, onChange } = useFieldValues(initialValues)
  const errors = state.errors ?? {}

  // written directly to the DOM node on click, so the value is already in place
  // when the form serialises — a state update would land one render too late
  const intentRef = useRef<HTMLInputElement>(null)
  const setIntent = (intent: 'save' | 'generate') => {
    if (intentRef.current) intentRef.current.value = intent
  }

  return (
    <>
      <form action={action}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="intent" defaultValue="save" ref={intentRef} />

        {state.error ? <div className="alert error">{state.error}</div> : null}
        {state.ok ? (
          <div className="alert ok">
            {state.ok}{' '}
            {state.documentId ? (
              <a href={`/api/documents/${state.documentId}`}>
                تحميل الملف{state.filename ? ` (${state.filename})` : ''}
              </a>
            ) : null}
          </div>
        ) : null}

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

        <div className="card tinted">
          <div className="section-title">النص المحتسب تلقائياً</div>
          <p className="muted">
            هذه القيم تُحسب من الحقول أعلاه وتُكتب في الصحيفة. حدّث الصفحة بعد الحفظ
            لإعادة احتسابها، أو تجاوزها يدوياً من القسم التالي.
          </p>
          <dl className="kv">
            {PREVIEW_ORDER.filter((p) => preview[p.key]).map((p) => (
              <div key={p.key} style={{ display: 'contents' }}>
                <dt>{p.labelAr}</dt>
                <dd>{preview[p.key]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card">
          <div className="section-title">تجاوز يدوي (اختياري)</div>
          <p className="muted">
            اترك الحقل فارغاً للإبقاء على القيمة المحتسبة تلقائياً.
          </p>
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
        </div>

        <div className="card">
          <div className="section-title">ملاحظة المحامي</div>
          <div className="field">
            <textarea name="lawyerNote" rows={3} defaultValue={lawyerNote} />
          </div>
          <div className="actions">
            <button
              className="btn"
              type="submit"
              onClick={() => setIntent('generate')}
              disabled={pending}
            >
              {pending ? 'جارٍ التنفيذ…' : 'إصدار الصحيفة (Word)'}
            </button>
            <button
              className="btn secondary"
              type="submit"
              onClick={() => setIntent('save')}
              disabled={pending}
            >
              حفظ التعديلات فقط
            </button>
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
              <a href={`/api/documents/${state.documentId}`}>تحميل الملف</a>
            </div>
          ) : null}
        </div>
      </form>

      <form action={rejectRequest} className="card">
        <input type="hidden" name="requestId" value={requestId} />
        <div className="section-title">إعادة الطلب للعميل</div>
        <div className="field">
          <label htmlFor="rejectNote">سبب الإعادة</label>
          <textarea id="rejectNote" name="lawyerNote" rows={2} required />
        </div>
        <button className="btn danger" type="submit">
          إعادة الطلب للعميل
        </button>
      </form>
    </>
  )
}
