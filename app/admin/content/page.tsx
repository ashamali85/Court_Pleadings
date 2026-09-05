import ContentEditor from '@/app/admin/content/content-editor'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { CONTENT_GROUPS, contentDefaults, getContent, translator } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)
  const defaults = contentDefaults()

  const entries = Object.keys(defaults)
    .sort()
    .map((key) => ({
      key,
      group: key.split('.')[0] ?? 'common',
      value: content[key] ?? defaults[key],
      defaultValue: defaults[key],
    }))

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('admin.content.title')}</h1>
              <p className="muted">{t('admin.content.subtitle')}</p>
            </div>
          </div>

          <ContentEditor
            entries={entries}
            groups={CONTENT_GROUPS}
            labels={{
              search: t('admin.content.searchLabel'),
              save: t('admin.content.saveBtn'),
              loading: t('common.loading'),
              defaultLabel: t('admin.content.defaultLabel'),
              modified: t('admin.content.modifiedBadge'),
              working: t('common.working'),
            }}
          />
        </div>
      </main>
    </>
  )
}
