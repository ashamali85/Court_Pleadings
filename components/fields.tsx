'use client'

import { useState } from 'react'
import type { FieldDef } from '@/lib/templates/types'

type Values = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : ''
  return String(v)
}

export function Field({
  field,
  values,
  errors,
  onChange,
  disabled,
}: {
  field: FieldDef
  values: Values
  errors: Record<string, string>
  onChange: (name: string, value: unknown) => void
  disabled?: boolean
}) {
  const error = errors[field.name]

  if (field.type === 'boolean') {
    return (
      <div className="field">
        <div className="checkbox">
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={Boolean(values[field.name])}
            onChange={(e) => onChange(field.name, e.target.checked)}
            disabled={disabled}
          />
          <div>
            <label htmlFor={field.name}>{field.labelAr}</label>
            {field.hintAr ? <div className="hint">{field.hintAr}</div> : null}
          </div>
        </div>
        {error ? <div className="field-error">{error}</div> : null}
      </div>
    )
  }

  // a mirrored field is filled from another field while its switch is on
  const mirrored =
    field.hiddenWhen && Boolean(values[field.hiddenWhen]) && field.mirrorOf
      ? str(values[field.mirrorOf])
      : null

  const value = mirrored ?? str(values[field.name])
  const isDisabled = disabled || mirrored !== null

  return (
    <div className="field">
      <label htmlFor={field.name}>
        {field.labelAr}
        {field.required ? ' *' : ''}
      </label>
      {field.hintAr ? <div className="hint">{field.hintAr}</div> : null}

      {field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          rows={field.rows ?? 4}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={isDisabled}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={isDisabled}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.labelAr}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type === 'number' ? 'number' : 'text'}
          step={field.type === 'number' ? '0.001' : undefined}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={isDisabled}
          dir={field.type === 'number' ? 'ltr' : undefined}
        />
      )}

      {mirrored !== null ? (
        <input type="hidden" name={field.name} value={mirrored} />
      ) : null}

      {error ? <div className="field-error">{error}</div> : null}
    </div>
  )
}

export function useFieldValues(initial: Values) {
  const [values, setValues] = useState<Values>(initial)
  const onChange = (name: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [name]: value }))
  return { values, onChange, setValues }
}
