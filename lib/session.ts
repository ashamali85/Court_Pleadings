import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'sahifa_session'
const ALG = 'HS256'
const MAX_AGE_SECONDS = 60 * 60 * 8 // 8 hours

function key(secret: string) {
  return new TextEncoder().encode(secret)
}

/** The token carries ONLY the user id. Role and active status are read fresh. */
export async function signSession(userId: string, secret: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key(secret))
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: [ALG],
    })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
