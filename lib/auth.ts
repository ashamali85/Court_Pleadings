import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import db from '@/lib/db'
import { env } from '@/lib/env'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: 'CLIENT' | 'ADMIN'
}

/**
 * Authoritative check. The proxy only verifies the signature at the edge of the
 * request; every page and every server action calls this, so a user who has
 * been deactivated loses access on their next request.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const userId = await verifySession(token, env.JWT_SECRET)
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, role: true, active: true },
  })
  if (!user || !user.active) return null

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') redirect('/requests')
  return user
}
