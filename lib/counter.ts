import 'server-only'
import db from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma/client'

/**
 * Sequential, human-facing reference numbers: SR-2026-0001.
 * The upsert is atomic, so two clients submitting at the same moment cannot
 * take the same number.
 */
export async function nextReference(
  tx: Prisma.TransactionClient | typeof db = db,
  year = new Date().getFullYear(),
): Promise<string> {
  const key = `case_request:${year}`
  const counter = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  })
  return `SR-${year}-${String(counter.value).padStart(4, '0')}`
}
