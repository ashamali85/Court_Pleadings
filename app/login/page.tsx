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
      <main className="auth-main">
        <div className="auth-split">
          <aside className="auth-art">
            {/* Decorative hero. The poster is also the CSS background, so the
                first paint, the reduced-motion fallback and a blocked video
                all show the same frame. Muted + playsInline so mobile Safari
                will autoplay it; aria-hidden because it carries no meaning. */}
            <video
              className="auth-video"
              poster="/brand/login-kuwait-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src="/brand/login-kuwait.mp4" type="video/mp4" />
            </video>
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
