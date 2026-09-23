'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import DateField from '@/components/date-field'
import type { FieldDef } from '@/lib/templates/types'

type Values = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : ''
  return String(v)
}

/**
 * The 12-column form column. Each Field places itself with `--span`, so a
 * section's layout is data on the field and not a special case in the page.
 */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>
}

/** `.w-num`, `.w-sel`, … — the control's width, named after its content. */
function widthClass(field: FieldDef): string | undefined {
  if (!field.width || field.width === 'full') return undefined
  return `w-${field.width}`
}

/** A Latin-digit field reads left-to-right even inside an RTL form. */
function controlClass(field: FieldDef): string | undefined {
  const classes = [widthClass(field), field.latinDigits ? 'num' : null].filter(Boolean)
  return classes.length ? classes.join(' ') : undefined
}

function spanStyle(field: FieldDef): CSSProperties | undefined {
  if (!field.span || field.span === 12) return undefined
  return { '--span': field.span } as CSSProperties
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

/** A field with `showWhen` exists only while another field holds one of the
    listed values. Hidden means unmounted, so it submits nothing at all and the
    schema decides what an absent value means. */
export function isVisible(field: FieldDef, values: Values): boolean {
  if (!field.showWhen) return true
  return field.showWhen.equals.includes(str(values[field.showWhen.field]))
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

  if (!isVisible(field, values)) return null

  if (field.type === 'rows') {
    return (
      <RowsField
        field={field}
        values={values}
        errors={errors}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

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
  const control = controlClass(field)

  return (
    <div className="field" style={spanStyle(field)}>
      <div className="label-row">
        <label htmlFor={field.name}>
          {field.labelAr}
          {field.required ? <span className="req">*</span> : null}
        </label>
        {field.hintAr ? (
          <HintButton text={field.hintAr} forLabel={field.labelAr} />
        ) : null}
      </div>

      {field.type === 'date' ? (
        <DateField
          id={field.name}
          name={field.name}
          className={widthClass(field)}
          value={value}
          onChange={(next) => onChange(field.name, next)}
          disabled={isDisabled}
          placeholder={field.placeholder}
        />
      ) : field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          className={control}
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
          className={widthClass(field)}
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
          type="text"
          className={control}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          disabled={isDisabled}
        />
      )}

      {mirrored !== null ? (
        <input type="hidden" name={field.name} value={mirrored} />
      ) : null}

      {error ? <div className="field-error">{error}</div> : null}
    </div>
  )
}

type Row = Record<string, string>

function readRows(value: unknown, field: FieldDef): Row[] {
  const min = field.minRows ?? 1
  const blank = () =>
    Object.fromEntries((field.rowFields ?? []).map((f) => [f.name, ''])) as Row

  const rows: Row[] = Array.isArray(value)
    ? (value as unknown[]).map((row) => ({ ...blank(), ...(row as Row) }))
    : []

  while (rows.length < min) rows.push(blank())
  return rows
}

/**
 * A repeatable group: one card per row, numbered, with its own remove button.
 * The whole array rides to the server as JSON in a single hidden input, so
 * nothing here depends on FormData's flat key space.
 */
function RowsField({
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
  const rows = readRows(values[field.name], field)
  const min = field.minRows ?? 1
  const error = errors[field.name]

  const setRow = (index: number, sub: string, next: string) => {
    const copy = rows.map((row, i) => (i === index ? { ...row, [sub]: next } : row))
    onChange(field.name, copy)
  }

  const addRow = () => {
    const blank = Object.fromEntries(
      (field.rowFields ?? []).map((f) => [f.name, '']),
    ) as Row
    onChange(field.name, [...rows, blank])
  }

  const removeRow = (index: number) =>
    onChange(
      field.name,
      rows.filter((_, i) => i !== index),
    )

  return (
    <div className="field">
      <div className="label-row">
        <label>
          {field.labelAr}
          {field.required ? <span className="req">*</span> : null}
        </label>
        {field.hintAr ? (
          <HintButton text={field.hintAr} forLabel={field.labelAr} />
        ) : null}
      </div>

      <div className="rows-group">
        {rows.map((row, index) => (
          <div className="rows-item" key={index}>
            <div className="rows-item-head">
              <span className="rows-item-title">
                {field.rowLabelAr ?? field.labelAr} {index + 1}
              </span>
              {rows.length > min ? (
                <button
                  type="button"
                  className="rows-remove"
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                >
                  حذف
                </button>
              ) : null}
            </div>

            <div className="form-grid">
              {(field.rowFields ?? []).map((sub) => {
                const id = `${field.name}-${index}-${sub.name}`
                const subError = errors[`${field.name}.${index}.${sub.name}`]
                return (
                  <div className="field" key={sub.name} style={spanStyle(sub)}>
                    <div className="label-row">
                      <label htmlFor={id}>
                        {sub.labelAr}
                        {sub.required ? <span className="req">*</span> : null}
                      </label>
                    </div>
                    {sub.type === 'select' ? (
                      <select
                        id={id}
                        className={widthClass(sub)}
                        value={row[sub.name] ?? ''}
                        onChange={(e) => setRow(index, sub.name, e.target.value)}
                        disabled={disabled}
                      >
                        <option value="">—</option>
                        {sub.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.labelAr}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type="text"
                        className={controlClass(sub)}
                        inputMode={sub.latinDigits ? 'numeric' : undefined}
                        value={row[sub.name] ?? ''}
                        placeholder={sub.placeholder}
                        onChange={(e) => setRow(index, sub.name, e.target.value)}
                        disabled={disabled}
                      />
                    )}
                    {subError ? <div className="field-error">{subError}</div> : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rows-foot">
        <button
          type="button"
          className="btn secondary rows-add"
          onClick={addRow}
          disabled={disabled}
        >
          {field.addLabelAr ?? 'إضافة'}
        </button>
      </div>

      <input type="hidden" name={field.name} value={JSON.stringify(rows)} />

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
