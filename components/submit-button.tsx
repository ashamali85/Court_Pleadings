'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Submit button with a built-in busy state. While the form is submitting it
 * shows a spinner and the loading label; other buttons in the same form are
 * disabled but do not spin, so it stays obvious which action is running.
 */
export default function SubmitButton({
  children,
  loadingLabel = 'جارٍ التحميل…',
  className = 'btn',
  onClick,
}: {
  children: React.ReactNode
  loadingLabel?: string
  className?: string
  onClick?: () => void
}) {
  const { pending } = useFormStatus()
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    if (!pending) setClicked(false)
  }, [pending])

  const busy = pending && clicked

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={() => {
        setClicked(true)
        onClick?.()
      }}
    >
      {busy ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
