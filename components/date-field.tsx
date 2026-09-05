'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { parseDate, toLatinDigits } from '@/lib/numerals'

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

// Kuwait's week starts on Sunday
const WEEKDAY_INITIALS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

function todayParts() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function firstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
}

/**
 * Date input with a calendar popover. The value is always stored and submitted
 * as d/m/yyyy in Latin digits, whatever the keyboard produced.
 */
export default function DateField({
  id,
  name,
  value,
  onChange,
  disabled,
  placeholder,
  clearLabel = 'مسح',
  todayLabel = 'اليوم',
}: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  clearLabel?: string
  todayLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => parseDate(value || ''), [value])
  const [view, setView] = useState(() => {
    const base = selected ?? todayParts()
    return { year: base.year, month: base.month }
  })

  useEffect(() => {
    if (selected) setView({ year: selected.year, month: selected.month })
  }, [selected])

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

  const shift = (months: number) => {
    setView((v) => {
      const total = v.year * 12 + (v.month - 1) + months
      return { year: Math.floor(total / 12), month: (total % 12) + 1 }
    })
  }

  const pick = (day: number) => {
    onChange(`${day}/${view.month}/${view.year}`)
    setOpen(false)
  }

  const today = todayParts()
  const total = daysInMonth(view.year, view.month)
  const lead = firstWeekday(view.year, view.month)
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]

  return (
    <div className="date-wrap" ref={wrapRef}>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        id={id}
        className="date-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? 'date-value' : 'date-placeholder'}>
          {value ? toLatinDigits(value) : (placeholder ?? 'يوم/شهر/سنة')}
        </span>
        <span className="date-icon" aria-hidden="true">
          🗓
        </span>
      </button>

      {open ? (
        <div className="calendar" role="dialog" aria-label="اختيار التاريخ">
          <div className="calendar-head">
            <button type="button" onClick={() => shift(-1)} aria-label="الشهر السابق">
              ‹
            </button>
            <div className="calendar-title">
              <select
                value={view.month}
                onChange={(e) =>
                  setView((v) => ({ ...v, month: Number(e.target.value) }))
                }
                aria-label="الشهر"
              >
                {MONTHS_AR.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={view.year}
                onChange={(e) =>
                  setView((v) => ({ ...v, year: Number(e.target.value) }))
                }
                aria-label="السنة"
              >
                {Array.from({ length: 61 }, (_, i) => today.year + 5 - i).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ),
                )}
              </select>
            </div>
            <button type="button" onClick={() => shift(1)} aria-label="الشهر التالي">
              ›
            </button>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {WEEKDAY_INITIALS.map((day, i) => (
              <span key={`${day}-${i}`}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((day, index) =>
              day === null ? (
                <span key={`pad-${index}`} />
              ) : (
                <button
                  type="button"
                  key={day}
                  className={[
                    'calendar-day',
                    selected &&
                    selected.day === day &&
                    selected.month === view.month &&
                    selected.year === view.year
                      ? 'selected'
                      : '',
                    today.day === day &&
                    today.month === view.month &&
                    today.year === view.year
                      ? 'today'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="calendar-foot">
            <button
              type="button"
              onClick={() => {
                onChange(`${today.day}/${today.month}/${today.year}`)
                setOpen(false)
              }}
            >
              {todayLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              {clearLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
