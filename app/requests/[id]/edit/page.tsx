import { notFound, redirect } from 'next/navigation'
import { updateRequest } from '@/app/requests/actions'
import RequestForm from '@/app/requests/new/request-form'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import { env } from '@/lib/env'
import {
  applyContentToSections,
  getContent,
  templateName,
  translator,
} from '@/lib/content'
import db from '@/lib/db'
import { getTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

/** A client may edit their own request only while it has been returned to them. */
export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const request = await db.caseRequest.findUnique({ where: { id } })
  if (!request || request.clientId !== user.id) notFound()
  if (request.status !== 'REJECTED') redirect('/requests')

  const template = getTemplate(request.templateKey)
  if (!template) notFound()

  const content = await getContent()
  const t = translator(content)

  // what the client already sent, so the returned form shows it rather than
  // looking as though the files were lost; anything added now joins them on
  // resubmit under a fresh draft key
  const attached = env.attachmentsEnabled
    ? await db.attachment.findMany({
        where: { requestId: request.id },
        select: { id: true, kind: true, filename: true, size: true },
        orderBy: { createdAt: 'asc' },
      })
    : []
  const draftKey = crypto.randomUUID().replace(/-/g, '')

  return (
    <>
      <Topbar user={user} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>
                {t('client.edit.title')}{' '}
                <span className="ref">{request.reference}</span>
              </h1>
              <p className="muted">{templateName(template, content)}</p>
            </div>
          </div>

          <div className="alert warn">
            <strong>{t('client.edit.notice')}</strong>
            {request.lawyerNote ? (
              <div style={{ marginTop: 8 }}>
                {t('client.list.rejectionLabel')}: {request.lawyerNote}
              </div>
            ) : null}
          </div>

          <RequestForm
            action={updateRequest}
            templateKey={template.key}
            requestId={request.id}
            sections={applyContentToSections(template, content)}
            defaults={request.data as Record<string, unknown>}
            attachments={
              env.attachmentsEnabled
                ? { draftKey, userId: user.id, initial: attached }
                : undefined
            }
            clientNote={request.clientNote ?? ''}
            labels={{
              noteSection: t('client.new.noteSection'),
              noteLabel: t('client.new.noteLabel'),
              submit: t('client.edit.submitBtn'),
              loading: t('common.loading'),
              submitHint: t('client.new.submitHint'),
              needsFix: t('message.needsFix'),
              working: t('common.working'),
              attachSection: t('client.new.attachSection'),
            }}
          />
        </div>
      </main>
    </>
  )
}
