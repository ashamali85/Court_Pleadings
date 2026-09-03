import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

// Next 16 renamed middleware.ts to proxy.ts. This is a cheap signature check
// only — it is NOT the security boundary. Every page and every server action
// re-checks the user against the database (lib/auth.ts).
const PROTECTED = ['/requests', '/admin']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing or shorter than 32 characters')
  }

  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret)
  if (!userId) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/requests/:path*', '/admin/:path*'],
}
