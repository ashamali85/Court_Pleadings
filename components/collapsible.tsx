'use client'

import { useEffect, useId, useState } from 'react'

/**
 * A card whose body collapses. Collapsed by default.
 *
 * The body stays MOUNTED and is hidden with CSS — unmounting it would drop the
 * inputs out of the form and they would never reach the server action. A section
 * that contains a validation error opens itself, so an error is never hidden
 * behind a closed header.
 */
export default function SectionCard({
  title,
  children,
  defaultOpen = false,
  hasError = false,
  badge,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  hasError?: boolean
  badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  useEffect(() => {
    if (hasError) setOpen(true)
  }, [hasError])

  return (
    <div className="card">
      <button
        type="button"
        className="section-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {title}
          {hasError ? <span className="err-dot">يحتاج تصحيحاً</span> : null}
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
