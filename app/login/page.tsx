import { redirect } from 'next/navigation'
import LoginForm from '@/app/login/login-form'
import { getCurrentUser } from '@/lib/auth'
import { SkylineArt } from '@/components/brand'
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
      <main className="auth-main">
        <div className="auth-split">
          <aside className="auth-art">
            <SkylineArt className="auth-skyline" />
            <div className="auth-art-copy">
              <strong>{t('common.appName')}</strong>
              <span>{t('common.tagline')}</span>
            </div>
          </aside>
          <div className="auth-form">
            <h2>{t('login.title')}</h2>
            <p className="muted">{t('login.subtitle')}</p>
            <LoginForm
              next={next}
              labels={{
                email: t('login.email'),
                password: t('login.password'),
                submit: t('login.submit'),
                loading: t('login.loading'),
                working: t('common.working'),
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
}
