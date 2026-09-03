import { redirect } from 'next/navigation'
import LoginForm from '@/app/login/login-form'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/requests')

  const { next } = await searchParams

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span>
              مكتب المحاماة — نظام الطلبات
              <small>تقديم طلبات الدعاوى وإصدار الصحف القانونية</small>
            </span>
          </div>
        </div>
      </header>
      <main>
        <div className="auth-shell">
          <div className="card">
            <h2>تسجيل الدخول</h2>
            <p className="muted">أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.</p>
            <LoginForm next={next} />
          </div>
        </div>
      </main>
    </>
  )
}
