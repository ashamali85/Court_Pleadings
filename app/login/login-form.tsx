'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/(auth)/actions'
import LoadingOverlay from '@/components/loading-overlay'
import SubmitButton from '@/components/submit-button'

export default function LoginForm({
  next,
  labels,
}: {
  next?: string
  labels: {
    email: string
    password: string
    submit: string
    loading: string
    working: string
  }
}) {
  const [state, action] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action}>
      <LoadingOverlay label={labels.working} />
      {state.error ? <div className="alert error">{state.error}</div> : null}

      <input type="hidden" name="next" value={next ?? ''} />

      <div className="field">
        <label htmlFor="email">{labels.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
        />
      </div>

      <div className="field">
        <label htmlFor="password">{labels.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </div>

      <SubmitButton loadingLabel={labels.loading}>{labels.submit}</SubmitButton>
    </form>
  )
}
