import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components stays off: every page in this app reads live DB rows.
  serverExternalPackages: ['@prisma/client', 'pg', 'docxtemplater', 'pizzip'],
}

export default nextConfig
