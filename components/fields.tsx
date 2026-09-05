'use client'

import { useEffect, useRef, useState } from 'react'
import type { FieldDef } from '@/lib/templates/types'

type Values = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : ''
  return String(v)
}

/** Small ؟ button that reveals the field's guidance on click. */
export function HintButton({ text, forLabel }: { text: string; forLabel: string }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span className="hint-wrap" ref={wrapRef}>
      <button
        type="button"
        className="hint-btn"
        aria-expanded={open}
        aria-label={`تعليمات حقل ${forLabel}`}
        onClick={() => setOpen((v) => !v)}
      >
        ؟
      </button>
      {open ? <span className="hint-pop">{text}</span> : null}
    </span>
  )
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
          <div className="label-row">
            <label htmlFor={field.name}>{field.labelAr}</label>
            {field.hintAr ? (
              <HintButton text={field.hintAr} forLabel={field.labelAr} />
            ) : null}
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
      <div className="label-row">
        <label htmlFor={field.name}>
          {field.labelAr}
          {field.required ? ' *' : ''}
        </label>
        {field.hintAr ? (
          <HintButton text={field.hintAr} forLabel={field.labelAr} />
        ) : null}
      </div>

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
