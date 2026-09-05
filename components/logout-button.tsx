'use client'

import { useFormStatus } from 'react-dom'

export default function LogoutButton({
  label,
  loadingLabel,
}: {
  label: string
  loadingLabel: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? loadingLabel : label}
    </button>
  )
}
