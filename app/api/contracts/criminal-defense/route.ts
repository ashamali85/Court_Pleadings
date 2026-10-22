/**
 * POST /api/contracts/criminal-defense — the finished عقد محاماة.
 *
 * §4 of the stack file is explicit about what this handles: *"Data is
 * confidential client information (civil IDs, criminal case details): HTTPS
 * only, authenticated access (staff only), don't log request bodies, don't keep
 * generated files after download"*. So:
 *
 *   - `requireAdmin()` first, before the body is even read.
 *   - Nothing is written to the database. No Document row, no file on disk:
 *     the buffer is built in memory and streamed once.
 *   - Nothing of the body reaches a log, including on failure. The audit row
 *     records that a contract was generated and by whom, and which branches of
 *     the wording were used — never a name, a civil ID or a case number.
 *
 * `?blank=1` is example D of §5: an empty config, which the engine renders with
 * every variable as a yellow placeholder. It is the printable form.
 */
import { NextResponse } from 'next/server'
import { audit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { buildContract } from '@/lib/contracts/criminal-defense/engine'
import {
  contractFormSchema,
  contractInputSchema,
  toContractInput,
} from '@/lib/contracts/criminal-defense/schema'

export const dynamic = 'force-dynamic'

/**
 * `Content-Disposition` for an Arabic filename.
 *
 * §7 asks for `filename*=UTF-8''…`. The plain `filename` is kept beside it as
 * an ASCII fallback for anything that does not read RFC 5987 — without one,
 * such a client saves the response as the route's own name.
 */
function disposition(name: string): string {
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  )
  return `attachment; filename="contract.docx"; filename*=UTF-8''${encoded}`
}

const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function docx(buffer: Buffer, filename: string) {
  // a fresh ArrayBuffer-backed view, which is what BodyInit accepts
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': MIME,
      'Content-Length': String(buffer.length),
      'Content-Disposition': disposition(filename),
      // a contract is never worth caching anywhere
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

/** the blank printable form — §5 example D */
export async function GET(request: Request) {
  await requireAdmin()
  if (new URL(request.url).searchParams.get('blank') !== '1') {
    return NextResponse.json({ errors: { _: 'unknown request' } }, { status: 400 })
  }
  const buffer = await buildContract({})
  return docx(buffer, 'عقد محاماة - نموذج فارغ.docx')
}

export async function POST(request: Request) {
  const admin = await requireAdmin()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { errors: { _: 'البيانات المرسلة غير صحيحة.' } },
      { status: 400 },
    )
  }

  const parsed = contractFormSchema.safeParse(body)
  if (!parsed.success) {
    /*
     * One message per field, which is what the form highlights. The first
     * issue on a field wins — the rest are usually consequences of it, and a
     * stack of messages under one input is harder to act on than one.
     */
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_'
      if (!errors[field]) errors[field] = issue.message
    }
    return NextResponse.json({ errors }, { status: 422 })
  }

  const input = toContractInput(parsed.data)

  /*
   * §9's own schema, over what the engine is about to be handed. Nothing the
   * lawyer can type reaches this — it fails only if `toContractInput` is
   * wrong, and then it fails here rather than printing a contract with a
   * yellow box in it.
   */
  const checked = contractInputSchema.safeParse(input)
  if (!checked.success) {
    console.error(
      '[contract] transform produced an input the engine spec rejects:',
      checked.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    )
    return NextResponse.json({ errors: { _: 'تعذر إنشاء العقد.' } }, { status: 500 })
  }

  let buffer: Buffer
  try {
    buffer = await buildContract(input)
  } catch (error) {
    // the message only, never the config: the config is the client's data
    console.error(
      '[contract] build failed:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json({ errors: { _: 'تعذر إنشاء العقد.' } }, { status: 500 })
  }

  /*
   * What was produced, with nothing identifying in it. Which wording branches
   * were taken is the useful part if the office ever asks why two contracts
   * read differently; the names are in the file the lawyer saved, not here.
   */
  await audit({
    actorId: admin.id,
    action: 'contract.generated',
    entity: 'Contract',
    entityId: 'criminal-defense',
    meta: {
      mode: input.mode,
      feesMode: input.fees?.mode,
      hasGuarantor: Boolean(input.guarantor),
      hasAdditionalWork: Boolean(input.additional_work),
    },
  })

  return docx(buffer, `عقد محاماة - ${parsed.data.client_name}.docx`)
}
