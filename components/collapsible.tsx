'use client'

import { useEffect, useId, useState } from 'react'

/**
 * A card whose body collapses. Collapsed by default.
 *
 * The whole header strip is the button — its padding is the card's padding, so
 * clicking anywhere on the header row (not just the text) toggles the section.
 *
 * The body stays MOUNTED and is hidden with CSS; unmounting it would drop the
 * inputs out of the form and they would never reach the server action. A
 * section holding a validation error opens itself.
 */
export default function SectionCard({
  title,
  children,
  defaultOpen = false,
  hasError = false,
  errorLabel = 'يحتاج تصحيحاً',
  badge,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  hasError?: boolean
  errorLabel?: string
  badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  useEffect(() => {
    if (hasError) setOpen(true)
  }, [hasError])

  return (
    <div className="card collapsible">
      <button
        type="button"
        className="section-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {title}
          {hasError ? <span className="err-dot">{errorLabel}</span> : null}
          {!hasError && badge ? <span className="count-dot">{badge}</span> : null}
        </span>
        <span className="chev" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="section-body" id={bodyId} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
