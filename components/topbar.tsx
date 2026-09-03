import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import type { SessionUser } from '@/lib/auth'

export default function Topbar({ user }: { user: SessionUser }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span>
            مكتب المحاماة — نظام الطلبات
            <small>
              {user.fullName} · {user.role === 'ADMIN' ? 'محامٍ' : 'عميل'}
            </small>
          </span>
        </div>
        <nav>
          {user.role === 'ADMIN' ? (
            <Link href="/admin">الطلبات الواردة</Link>
          ) : (
            <>
              <Link href="/requests">طلباتي</Link>
              <Link href="/requests/new">طلب جديد</Link>
            </>
          )}
          <form action={logout}>
            <button type="submit">تسجيل الخروج</button>
          </form>
        </nav>
      </div>
    </header>
  )
}
