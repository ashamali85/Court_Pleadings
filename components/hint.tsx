'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The small ؟ beside a label that reveals an explanation.
 *
 * It opens three ways, because three kinds of people reach it: a pointer
 * hovering it, a keyboard tabbing onto it, and a tap on a touch screen where
 * hover does not exist. A click also *pins* it open, so the explanation does
 * not vanish the moment the pointer drifts off on its way to read it. Escape
 * or a click elsewhere closes it again.
 *
 * The text itself is never written here — it comes from the content map, so
 * the lawyer can reword every explanation on /admin/content without a deploy.
 */
export default function HintButton({
  text,
  forLabel,
  labelPrefix = 'تعليمات حقل',
}: {
  text: string
  forLabel: string
  /** «تعليمات حقل …» for a form field, «شرح …» for anything else */
  labelPrefix?: string
}) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    const close = () => {
      setOpen(false)
      setPinned(false)
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
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
    <span
      className="hint-wrap"
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false)
      }}
    >
      <button
        type="button"
        className="hint-btn"
        aria-expanded={open}
        aria-label={`${labelPrefix} ${forLabel}`}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!pinned) setOpen(false)
        }}
        onClick={() => {
          // a tap has no hover to rely on, and a click says "keep this open"
          setPinned((wasPinned) => {
            setOpen(!wasPinned)
            return !wasPinned
          })
        }}
      >
        ؟
      </button>
      {open ? <span className="hint-pop">{text}</span> : null}
    </span>
  )
}
