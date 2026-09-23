'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { searchOptions } from '@/lib/arabic-search'

export type ComboOption = { value: string; labelAr: string }

/**
 * A type-to-search select, built to the WAI-ARIA 1.2 combobox-with-listbox
 * pattern: the input owns the keyboard, the listbox is never focused, and the
 * active option is named by aria-activedescendant so a screen reader announces
 * it without focus ever leaving the text field.
 *
 * The visible input holds a *search query*; the value that reaches the server
 * is the option's code, in a hidden input. The two are only ever reconciled by
 * commit() and revert(), so a half-typed query can never be submitted.
 */
export default function Combobox({
  id,
  name,
  value,
  options,
  onChange,
  disabled,
  placeholder,
  className,
  icon,
  emptyAr = 'لا توجد نتيجة',
  invalid,
}: {
  id: string
  name?: string
  value: string
  options: readonly ComboOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  /** width class from the field definition, e.g. `w-sel` */
  className?: string
  /** drawn at the start of the field and of every option */
  icon?: (option: ComboOption) => React.ReactNode
  emptyAr?: string
  invalid?: boolean
}) {
  const listId = `${useId()}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  // closed, the input displays the selection; open, it displays what was typed
  const shown = open ? query : (selected?.labelAr ?? '')

  const matches = useMemo(
    () => (open ? searchOptions(options, query) : [...options]),
    [open, options, query],
  )

  const activeOption = matches[active]

  const openList = (nextQuery = '') => {
    if (disabled) return
    setQuery(nextQuery)
    const list = searchOptions(options, nextQuery)
    const at = list.findIndex((o) => o.value === value)
    setActive(at >= 0 ? at : 0)
    setOpen(true)
  }

  const commit = (option: ComboOption | undefined) => {
    if (option) onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  /** leave without choosing: the field goes back to the stored value */
  const revert = () => {
    setOpen(false)
    setQuery('')
  }

  // pointer down outside, and Escape, both mean "leave it as it was"
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) revert()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // keep the active option inside the scroll box without scrolling the page
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const move = (delta: number) => {
    if (!matches.length) return
    setActive((prev) => (prev + delta + matches.length) % matches.length)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList('')
        else move(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList('')
        else move(-1)
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActive(matches.length - 1)
        }
        break
      case 'Enter':
        if (open) {
          // the form must not submit because someone picked a nationality
          event.preventDefault()
          commit(activeOption)
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          revert()
        }
        break
      case 'Tab':
        // moving on commits what is highlighted, like a native select
        if (open) commit(activeOption)
        break
      default:
        break
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className={['combo-control', className].filter(Boolean).join(' ')}>
        {/* the flag stays while the box is merely open, and goes once a query
            is being typed, when it would be describing something else */}
        {icon && selected && (!open || !query) ? (
          <span className="combo-icon" aria-hidden="true">
            {icon(selected)}
          </span>
        ) : null}

        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          className="combo-input"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          /* an open, empty box would otherwise say nothing about what is
             currently chosen — so the selection becomes the placeholder */
          placeholder={(open ? selected?.labelAr : undefined) ?? placeholder}
          value={shown}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeOption ? `${listId}-${activeOption.value}` : undefined
          }
          aria-invalid={invalid || undefined}
          onChange={(e) => openList(e.target.value)}
          onMouseDown={() => {
            if (!open) openList('')
          }}
          onFocus={() => {
            if (!open) openList('')
          }}
          onBlur={(event) => {
            // a click on an option is a blur too; that handler commits first
            if (wrapRef.current?.contains(event.relatedTarget as Node)) return
            revert()
          }}
          onKeyDown={onKeyDown}
        />

        <span className="combo-chev" aria-hidden="true">
          ⌄
        </span>
      </div>

      <ul
        id={listId}
        role="listbox"
        ref={listRef}
        className="combo-list"
        hidden={!open}
      >
        {matches.map((option, index) => (
          <li
            key={option.value}
            id={`${listId}-${option.value}`}
            role="option"
            aria-selected={option.value === value}
            data-active={index === active}
            className="combo-option"
            // mousedown, not click: it beats the input's blur
            onMouseDown={(event) => {
              event.preventDefault()
              commit(option)
            }}
            onMouseEnter={() => setActive(index)}
          >
            {icon ? (
              <span className="combo-icon" aria-hidden="true">
                {icon(option)}
              </span>
            ) : null}
            <span className="combo-label">{option.labelAr}</span>
            {option.value === value ? (
              <span className="combo-tick" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </li>
        ))}

        {matches.length === 0 ? (
          <li className="combo-empty" role="presentation">
            {emptyAr}
          </li>
        ) : null}
      </ul>
    </div>
  )
}
