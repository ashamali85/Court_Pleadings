import Link from 'next/link'
import Topbar from '@/components/topbar'
import { requireAdmin } from '@/lib/auth'
import { getContent, translator } from '@/lib/content'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * The lawyer's home. Not a list of anything — the three places the office
 * works are each their own area now, and this says which is which and whether
 * anything is waiting.
 */
export default async function AdminHome() {
  const admin = await requireAdmin()
  const content = await getContent()
  const t = translator(content)

  const pending = await db.caseRequest.count({
    where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
  })

  const areas = [
    {
      href: '/admin/internal',
      titleAr: t('nav.internal'),
      descriptionAr: t('admin.home.internalHint'),
      note: '',
    },
    {
      href: '/admin/requests',
      titleAr: t('admin.inbox.title'),
      descriptionAr: t('admin.home.inboxHint'),
      note:
        pending > 0
          ? `${pending} ${t('admin.inbox.pending')}`
          : t('admin.inbox.noPending'),
    },
    {
      href: '/admin/content',
      titleAr: t('nav.content'),
      descriptionAr: t('admin.home.contentHint'),
      note: '',
    },
  ]

  return (
    <>
      <Topbar user={admin} content={content} />
      <main>
        <div className="container">
          <div className="page-head">
            <div>
              <h1>{t('admin.home.title', { name: admin.fullName })}</h1>
              <p className="muted">{t('admin.home.subtitle')}</p>
            </div>
          </div>

          <div className="choice-list">
            {areas.map((area) => (
              <div className="choice-card" key={area.href}>
                <Link className="choice-name" href={area.href}>
                  {area.titleAr}
                </Link>
                <span className="choice-desc">{area.descriptionAr}</span>
                {area.note ? <span className="choice-note">{area.note}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
