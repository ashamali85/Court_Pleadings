import { redirect } from 'next/navigation'
import LoginForm from '@/app/login/login-form'
import { getCurrentUser } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/requests')

  const { next } = await searchParams
  const t = translator(await getContent())

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span>
              {t('common.appName')}
              <small>{t('common.tagline')}</small>
            </span>
          </div>
        </div>
      </header>
      <main>
        <div className="auth-shell">
          <div className="card">
            <h2>{t('login.title')}</h2>
            <p className="muted">{t('login.subtitle')}</p>
            <LoginForm
              next={next}
              labels={{
                email: t('login.email'),
                password: t('login.password'),
                submit: t('login.submit'),
                loading: t('login.loading'),
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
}
