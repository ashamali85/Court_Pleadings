import RequestForm from '@/app/requests/new/request-form'
import Topbar from '@/components/topbar'
import { requireUser } from '@/lib/auth'
import { evictionDefaults } from '@/lib/templates/eviction'
import { templates } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export default async function NewRequestPage() {
  const user = await requireUser()
  const template = templates[0]

  return (
    <>
      <Topbar user={user} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{template.nameAr}</h1>
              <p className="muted">{template.descriptionAr}</p>
            </div>
          </div>

          <RequestForm
            templateKey={template.key}
            sections={template.sections}
            defaults={evictionDefaults as unknown as Record<string, unknown>}
          />
        </div>
      </main>
    </>
  )
}
