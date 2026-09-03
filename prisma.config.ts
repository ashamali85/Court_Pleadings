import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 no longer auto-loads .env and no longer reads the datasource url
// from schema.prisma. CLI work (db push, studio) uses the NON-pooled URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
