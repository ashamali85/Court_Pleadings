import { submitRequest } from '@/app/requests/actions'
import RequestForm from '@/app/requests/new/request-form'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import {
  applyContentToSections,
  getContent,
  templateDescription,
  templateName,
  translator,
} from '@/lib/content'
import { templates } from '@/lib/templates'
import { evictionDefaults } from '@/lib/templates/eviction'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const user = await requireUser()
  const content = await getContent()
  const t = translator(content)
  const template = templates[0]

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
          </div>

          <RequestForm
            action={submitRequest}
            templateKey={template.key}
            sections={applyContentToSections(template, content)}
            defaults={evictionDefaults as unknown as Record<string, unknown>}
            labels={{
              noteSection: t('client.new.noteSection'),
              noteLabel: t('client.new.noteLabel'),
              submit: t('client.new.submitBtn'),
              loading: t('common.loading'),
              submitHint: t('client.new.submitHint'),
              needsFix: t('message.needsFix'),
            }}
          />
        </div>
      </main>
    </>
  )
}
