import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import LogoutButton from '@/components/logout-button'
import type { SessionUser } from '@/lib/auth'
import { translator, type ContentMap } from '@/lib/content'

export default function Topbar({
  user,
  content,
}: {
  user: SessionUser
  content: ContentMap
}) {
  const t = translator(content)

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href={user.role === 'ADMIN' ? '/admin' : '/requests'}>
          <img src="/brand/logo.png" alt="" className="brand-mark" />
          <span>
            {t('common.appName')}
            <small>
              {user.fullName} ·{' '}
              {user.role === 'ADMIN' ? t('common.roleAdmin') : t('common.roleClient')}
            </small>
          </span>
        </Link>
        <nav>
          {user.role === 'ADMIN' ? (
            <>
              <Link href="/admin/internal">{t('nav.internal')}</Link>
              <Link href="/admin/requests">{t('admin.inbox.title')}</Link>
              <Link href="/admin/content">{t('nav.content')}</Link>
            </>
          ) : (
            <>
              <Link href="/requests">{t('nav.myRequests')}</Link>
              <Link href="/requests/new">{t('nav.newRequest')}</Link>
            </>
          )}
          <form action={logout}>
            <LogoutButton label={t('nav.logout')} loadingLabel={t('common.loading')} />
          </form>
        </nav>
      </div>
    </header>
  )
}
