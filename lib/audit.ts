import 'server-only'
import { headers } from 'next/headers'
import db from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma/client'

type AuditInput = {
  actorId?: string | null
  action: string
  entity: string
  entityId: string
  meta?: Prisma.InputJsonValue
}

/** Every mutation writes one of these. Never throws into the caller's path. */
export async function audit({ actorId, action, entity, entityId, meta }: AuditInput) {
  try {
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null

    await db.auditLog.create({
      data: { actorId: actorId ?? null, action, entity, entityId, meta, ip },
    })
  } catch (error) {
    console.error('[audit] failed to write audit log', error)
  }
}
