'use client'

import { upload } from '@vercel/blob/client'
import { useRef, useState } from 'react'
import {
  ACCEPT_ATTRIBUTE,
  ATTACHMENT_KINDS,
  blobFolder,
  humanSize,
  MAX_ATTACHMENT_BYTES,
} from '@/lib/attachments'

export type AttachedFile = {
  id: string
  kind: string
  filename: string
  size: number
}

type Slot =
  | { state: 'empty' }
  | { state: 'uploading'; filename: string; percent: number }
  | { state: 'done'; file: AttachedFile }
  | { state: 'error'; message: string }

/**
 * The seven optional slots.
 *
 * A file uploads the moment it is chosen rather than on submit, for two
 * reasons: the client sees straight away that it worked, and the bytes go
 * browser-to-store without passing through a Vercel function, which caps a
 * request body at 4.5MB — well under a phone photo of a lease.
 *
 * Because the upload precedes the request, each file is held against a
 * `draftKey` generated here and adopted by the request when it is submitted.
 */
export default function Attachments({
  draftKey,
  userId,
  initial,
  disabled,
}: {
  draftKey: string
  userId: string
  initial: AttachedFile[]
  disabled?: boolean
}) {
  const [slots, setSlots] = useState<Record<string, Slot>>(() => {
    const start: Record<string, Slot> = {}
    for (const { value } of ATTACHMENT_KINDS) start[value] = { state: 'empty' }
    for (const file of initial) start[file.kind] = { state: 'done', file }
    return start
  })

  const setSlot = (kind: string, slot: Slot) =>
    setSlots((prev) => ({ ...prev, [kind]: slot }))

  const onPick = async (kind: string, file: File) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setSlot(kind, {
        state: 'error',
        message: `حجم الملف ${humanSize(file.size)} — الحد الأقصى ${humanSize(MAX_ATTACHMENT_BYTES)}`,
      })
      return
    }

    setSlot(kind, { state: 'uploading', filename: file.name, percent: 0 })

    try {
      const blob = await upload(`${blobFolder(userId, draftKey)}/${file.name}`, file, {
        access: 'private',
        handleUploadUrl: '/api/attachments/upload',
        clientPayload: JSON.stringify({ draftKey, kind }),
        onUploadProgress: ({ percentage }) =>
          setSlot(kind, {
            state: 'uploading',
            filename: file.name,
            percent: Math.round(percentage),
          }),
      })

      // the row is written server-side, where the blob is verified with head()
      const response = await fetch('/api/attachments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathname: blob.pathname,
          kind,
          draftKey,
          filename: file.name,
        }),
      })
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(error ?? 'تعذّر حفظ المرفق')
      }

      setSlot(kind, { state: 'done', file: (await response.json()) as AttachedFile })
    } catch (error) {
      setSlot(kind, {
        state: 'error',
        message: error instanceof Error ? error.message : 'تعذّر رفع الملف',
      })
    }
  }

  const onRemove = async (kind: string, id: string) => {
    setSlot(kind, { state: 'uploading', filename: '', percent: 100 })
    const response = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
    if (response.ok) {
      setSlot(kind, { state: 'empty' })
      return
    }
    const { error } = (await response.json().catch(() => ({}))) as { error?: string }
    setSlot(kind, { state: 'error', message: error ?? 'تعذّر حذف المرفق' })
  }

  return (
    <>
      <input type="hidden" name="draftKey" value={draftKey} />
      <p className="muted">
        كل المرفقات اختيارية. الصيغ المقبولة: PDF أو صورة، بحد أقصى{' '}
        {humanSize(MAX_ATTACHMENT_BYTES)} للملف الواحد.
      </p>

      <ul className="attach-list">
        {ATTACHMENT_KINDS.map(({ value, labelAr }) => (
          <AttachmentRow
            key={value}
            kind={value}
            labelAr={labelAr}
            slot={slots[value] ?? { state: 'empty' }}
            disabled={disabled}
            onPick={onPick}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </>
  )
}

function AttachmentRow({
  kind,
  labelAr,
  slot,
  disabled,
  onPick,
  onRemove,
}: {
  kind: string
  labelAr: string
  slot: Slot
  disabled?: boolean
  onPick: (kind: string, file: File) => void
  onRemove: (kind: string, id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = `attach-${kind}`

  return (
    <li className="attach-row">
      <div className="attach-head">
        <span className="attach-label">{labelAr}</span>
        <span className="attach-optional">اختياري</span>
      </div>

      <div className="attach-body">
        {slot.state === 'done' ? (
          <>
            <a
              className="attach-file"
              href={`/api/attachments/${slot.file.id}`}
              download
            >
              <span className="attach-name">{slot.file.filename}</span>
              <span className="attach-size">{humanSize(slot.file.size)}</span>
            </a>
            <button
              type="button"
              className="attach-remove"
              onClick={() => onRemove(kind, slot.file.id)}
              disabled={disabled}
            >
              حذف
            </button>
          </>
        ) : slot.state === 'uploading' ? (
          <span className="attach-progress" role="status">
            جارٍ الرفع… {slot.percent}%
          </span>
        ) : (
          <>
            <label className="btn secondary attach-pick" htmlFor={inputId}>
              اختيار ملف
            </label>
            {slot.state === 'error' ? (
              <span className="field-error attach-error">{slot.message}</span>
            ) : null}
          </>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="attach-input"
          accept={ACCEPT_ATTRIBUTE}
          disabled={disabled}
          aria-label={labelAr}
          onChange={(event) => {
            const file = event.target.files?.[0]
            // let the same file be chosen again after a failure
            event.target.value = ''
            if (file) onPick(kind, file)
          }}
        />
      </div>
    </li>
  )
}
