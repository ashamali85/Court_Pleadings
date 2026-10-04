import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { templates } from '../lib/templates'

// Prisma 7: the seed builds its own client and loads .env itself.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
})
const db = new PrismaClient({ adapter })

// The .docx template lives in the database so a new version can be uploaded
// without redeploying; the file in templates/ is the source of truth at seed time.
async function seedTemplates() {
  for (const template of templates) {
    /*
     * A case type can exist before its Word file does: the questions, the
     * rules and the wording are useful on their own, and the client can
     * already submit. The row is created with no bytes, and the review screen
     * says the template is missing rather than the deploy failing here.
     */
    const path = join(process.cwd(), 'templates', `${template.key}.docx`)
    if (!existsSync(path)) {
      await db.caseTemplate.upsert({
        where: { key: template.key },
        create: {
          key: template.key,
          nameAr: template.nameAr,
          descriptionAr: template.descriptionAr,
          docx: new Uint8Array(0),
          version: 1,
        },
        update: { nameAr: template.nameAr, descriptionAr: template.descriptionAr },
      })
      console.warn(
        `[seed] template ${template.key} has no .docx yet — requests can be ` +
          'submitted, but no document can be generated',
      )
      continue
    }

    // fresh ArrayBuffer, so it matches Prisma's Uint8Array<ArrayBuffer> Bytes type
    const docx = new Uint8Array(readFileSync(path))
    const existing = await db.caseTemplate.findUnique({ where: { key: template.key } })

    if (!existing) {
      await db.caseTemplate.create({
        data: {
          key: template.key,
          nameAr: template.nameAr,
          descriptionAr: template.descriptionAr,
          docx,
          version: 1,
        },
      })
      console.log(`[seed] created template ${template.key}`)
      continue
    }

    const changed = !Buffer.from(existing.docx).equals(docx)
    await db.caseTemplate.update({
      where: { key: template.key },
      data: {
        nameAr: template.nameAr,
        descriptionAr: template.descriptionAr,
        docx,
        version: changed ? existing.version + 1 : existing.version,
      },
    })
    console.log(
      `[seed] template ${template.key} ${changed ? 'updated to v' + (existing.version + 1) : 'unchanged'}`,
    )
  }
}

async function seedUsers() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn(
      '[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin account created.',
    )
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, active: true, role: 'ADMIN' },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      fullName: process.env.SEED_ADMIN_NAME ?? 'محامي المكتب',
      role: 'ADMIN',
    },
  })
  console.log(`[seed] admin account ready: ${email}`)

  const clientEmail = process.env.SEED_CLIENT_EMAIL
  const clientPassword = process.env.SEED_CLIENT_PASSWORD
  if (clientEmail && clientPassword) {
    const hash = await bcrypt.hash(clientPassword, 12)
    await db.user.upsert({
      where: { email: clientEmail.toLowerCase() },
      update: { passwordHash: hash, active: true },
      create: {
        email: clientEmail.toLowerCase(),
        passwordHash: hash,
        fullName: process.env.SEED_CLIENT_NAME ?? 'عميل المكتب',
        role: 'CLIENT',
      },
    })
    console.log(`[seed] client account ready: ${clientEmail}`)
  }
}

async function main() {
  await seedTemplates()
  await seedUsers()
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await db.$disconnect()
    process.exit(1)
  })
