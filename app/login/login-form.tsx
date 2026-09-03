'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/(auth)/actions'

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action}>
      {state.error ? <div className="alert error">{state.error}</div> : null}

      <input type="hidden" name="next" value={next ?? ''} />

      <div className="field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" autoComplete="username" required dir="ltr" />
      </div>

      <div className="field">
        <label htmlFor="password">كلمة المرور</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </div>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'جارٍ التحقق…' : 'دخول'}
      </button>
    </form>
  )
}
