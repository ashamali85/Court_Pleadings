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

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  JWT_SECRET: required('JWT_SECRET', 32),
  // optional — email notifications are skipped when unset
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  MAIL_FROM: process.env.MAIL_FROM ?? '',
  ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL ?? '',
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
}
