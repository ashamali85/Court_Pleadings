'use client'

import { useFormStatus } from 'react-dom'

/**
 * Full-screen busy indicator, shown while the form it sits in is submitting.
 * Must be rendered INSIDE a <form> — useFormStatus reports the status of the
 * nearest enclosing form.
 */
export default function LoadingOverlay({ label }: { label: string }) {
  const { pending } = useFormStatus()
  if (!pending) return null

  return (
    <div
      className="loading-overlay"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="loading-card">
        <div className="loading-title">{label}</div>
        <div className="loading-bar" />
      </div>
    </div>
  )
}
