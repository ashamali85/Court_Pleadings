import type { AttachmentKind } from '@/lib/generated/prisma/client'

/**
 * What a client may attach, in the order the form shows them.
 *
 * Every one is optional: a client who has only the lease should still be able
 * to send the request, and the lawyer chases the rest.
 *
 * The value is a stable enum code and the label is what the client reads, so
 * rewording one never rewrites stored rows.
 */
export const ATTACHMENT_KINDS: { value: AttachmentKind; labelAr: string }[] = [
  { value: 'LEASE', labelAr: 'عقد الإيجار' },
  { value: 'PLAINTIFF_ID', labelAr: 'البطاقة المدنية للمدعي' },
  { value: 'DEFENDANT_ID', labelAr: 'البطاقة المدنية للمدعى عليه' },
  { value: 'COMPANY_DEED', labelAr: 'عقد تأسيس الشركة المدعية' },
  { value: 'TRADE_LICENCE', labelAr: 'الترخيص التجاري للمدعي' },
  { value: 'HEIRS_INVENTORY', labelAr: 'حصر الورثة' },
  { value: 'OTHER', labelAr: 'مستندات أخرى' },
]

const KIND_LABEL = new Map(ATTACHMENT_KINDS.map((k) => [k.value, k.labelAr]))

export function attachmentLabel(kind: string): string {
  return KIND_LABEL.get(kind as AttachmentKind) ?? kind
}

export function isAttachmentKind(value: string): value is AttachmentKind {
  return KIND_LABEL.has(value as AttachmentKind)
}

/**
 * What the upload will accept. Scans and phone photos cover nearly everything a
 * client sends; the list is deliberately closed rather than "any file", so a
 * stray .exe or .html never reaches the blob store in the first place.
 */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
] as const

/** for the file input's `accept`, which matches on extension as well as type */
export const ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_MIME_TYPES,
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
  '.webp',
].join(',')

/** 20MB — a multi-page phone scan of a lease, with room to spare */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} كيلوبايت`
  return `${(kb / 1024).toFixed(1)} ميجابايت`
}

/**
 * Where the file sits inside the private store. The client id leads, and both
 * the upload token and the confirmation re-derive this prefix from the session
 * — so a client can only ever write into, or claim, its own folder. The SDK
 * adds a random suffix, so re-uploading the same filename never overwrites.
 */
export function blobFolder(userId: string, draftKey: string): string {
  return `requests/${userId}/${draftKey}`
}

/** opaque, client-generated, and only ever used to group one draft's uploads */
export function isDraftKey(value: string): boolean {
  return /^[A-Za-z0-9_-]{8,64}$/.test(value)
}

/** a filename safe to echo back in a header, with the extension preserved */
export function safeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, 180) || 'attachment'
}
