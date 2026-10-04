import Link from 'next/link'
import { notFound } from 'next/navigation'
import { submitRequest } from '@/app/requests/actions'
import RequestForm from '@/app/requests/new/request-form'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import { env } from '@/lib/env'
import {
  applyContentToSections,
  getContent,
  templateDescription,
  templateName,
  translator,
} from '@/lib/content'
import { getTemplate, templates } from '@/lib/templates'

export const dynamic = 'force-dynamic'

/**
 * The office offers more than one kind of case, and they ask different
 * questions. With `?type=` the client gets that form; without it, and with
 * more than one on offer, they are asked which case this is — a form that
 * silently defaulted to the first case type would collect the wrong answers.
 */
export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const user = await requireUser()
  const content = await getContent()
  const t = translator(content)
  const { type } = await searchParams

  if (!type && templates.length > 1) {
    return (
      <>
        <Topbar user={user} content={content} />
        <main>
          <div className="container">
            <div className="page-head">
              <div>
                <h1>{t('client.new.chooseTitle')}</h1>
                <p className="muted">{t('client.new.chooseHint')}</p>
              </div>
            </div>

            <div className="choice-list">
              {templates.map((template) => (
                <Link
                  key={template.key}
                  className="choice-card"
                  href={`/requests/new?type=${encodeURIComponent(template.key)}`}
                >
                  <span className="choice-name">{templateName(template, content)}</span>
                  <span className="choice-desc">
                    {templateDescription(template, content)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </>
    )
  }

  const template = type ? getTemplate(type) : templates[0]
  if (!template) notFound()

  // a fresh key per visit; the uploads it groups are adopted by the request on
  // submit. Generated on the server so the first render already carries it.
  const draftKey = crypto.randomUUID().replace(/-/g, '')
  const attachable = env.attachmentsEnabled && template.acceptsAttachments

  return (
    <>
      <Topbar user={user} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{templateName(template, content)}</h1>
              <p className="muted">{templateDescription(template, content)}</p>
            </div>
            {templates.length > 1 ? (
              <Link className="btn secondary" href="/requests/new">
                {t('client.new.changeType')}
              </Link>
            ) : null}
          </div>

          <RequestForm
            action={submitRequest}
            templateKey={template.key}
            sections={applyContentToSections(template, content)}
            defaults={template.defaults}
            attachments={
              attachable ? { draftKey, userId: user.id, initial: [] } : undefined
            }
            labels={{
              noteSection: t('client.new.noteSection'),
              noteLabel: t('client.new.noteLabel'),
              submit: t('client.new.submitBtn'),
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
