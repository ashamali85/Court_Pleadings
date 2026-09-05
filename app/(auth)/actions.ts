'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { audit } from '@/lib/audit'
import db from '@/lib/db'
import { getContent, translator } from '@/lib/content'
import { env } from '@/lib/env'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/session'

export type LoginState = { error?: string }

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
  next: z.string().optional(),
})

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' }
  }

  const { email, password, next } = parsed.data
  const user = await db.user.findUnique({ where: { email } })

  // constant-ish work whether or not the account exists
  const hash =
    user?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
  const ok = await bcrypt.compare(password, hash)

  if (!user || !ok || !user.active) {
    await audit({
      actorId: user?.id ?? null,
      action: 'login.failed',
      entity: 'User',
      entityId: user?.id ?? email,
    })
    const t = translator(await getContent())
    return { error: t('message.loginFailed') }
  }

  const token = await signSession(user.id, env.JWT_SECRET)
  ;(await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions)

  await audit({
    actorId: user.id,
    action: 'login.success',
    entity: 'User',
    entityId: user.id,
  })

  const destination =
    next && next.startsWith('/') && !next.startsWith('//')
      ? next
      : user.role === 'ADMIN'
        ? '/admin'
        : '/requests'
  redirect(destination)
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
