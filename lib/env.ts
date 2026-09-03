import 'server-only'

function required(name: string, minLength = 1): string {
  const value = process.env[name]
  if (!value || value.length < minLength) {
    throw new Error(
      `Missing or invalid environment variable ${name}` +
        (minLength > 1 ? ` (must be at least ${minLength} characters)` : ''),
    )
  }
  return value
}

/**
 * Validated lazily, on first access.
 *
 * `next build` imports every module to collect page data, so validating at
 * module scope would fail the build rather than the request — and a build box
 * legitimately may not carry runtime secrets. These getters still fail fast:
 * the first request that needs a missing variable throws immediately, naming
 * the variable.
 */
export const env = {
  get DATABASE_URL(): string {
    return required('DATABASE_URL')
  },
  get DIRECT_URL(): string {
    return process.env.DIRECT_URL ?? required('DATABASE_URL')
  },
  get JWT_SECRET(): string {
    return required('JWT_SECRET', 32)
  },
  // optional — email notifications are skipped when unset
  get RESEND_API_KEY(): string {
    return process.env.RESEND_API_KEY ?? ''
  },
  get MAIL_FROM(): string {
    return process.env.MAIL_FROM ?? ''
  },
  get ADMIN_NOTIFY_EMAIL(): string {
    return process.env.ADMIN_NOTIFY_EMAIL ?? ''
  },
  get APP_URL(): string {
    return process.env.APP_URL ?? 'http://localhost:3000'
  },
}

/** Explicit check for scripts and health endpoints. Throws on the first problem. */
export function assertEnv(): void {
  void env.DATABASE_URL
  void env.DIRECT_URL
  void env.JWT_SECRET
}
