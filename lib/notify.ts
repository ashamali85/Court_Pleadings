import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

// Email is optional: with no RESEND_API_KEY the app logs and carries on, so a
// mail outage can never block a submission or a document.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

async function send(to: string, subject: string, html: string) {
  if (!resend || !env.MAIL_FROM || !to) {
    console.info('[notify] skipped (email not configured):', subject, to)
    return
  }
  try {
    await resend.emails.send({ from: env.MAIL_FROM, to, subject, html })
  } catch (error) {
    console.error('[notify] send failed', error)
  }
}

const wrap = (body: string) =>
  `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#10284f;line-height:1.9">${body}</div>`

export async function notifyAdminOfNewRequest(input: {
  reference: string
  clientName: string
  templateName: string
}) {
  await send(
    env.ADMIN_NOTIFY_EMAIL,
    `طلب جديد ${input.reference}`,
    wrap(
      `<h2>طلب جديد</h2>
       <p>ورد طلب جديد برقم <strong>${input.reference}</strong>.</p>
       <p>مقدم الطلب: ${input.clientName}<br/>نوع الصحيفة: ${input.templateName}</p>
       <p><a href="${env.APP_URL}/admin">فتح لوحة الطلبات</a></p>`,
    ),
  )
}

export async function notifyClientOfStatus(input: {
  to: string
  reference: string
  statusAr: string
  note?: string | null
}) {
  await send(
    input.to,
    `تحديث على الطلب ${input.reference}`,
    wrap(
      `<h2>تحديث على طلبك</h2>
       <p>الطلب رقم <strong>${input.reference}</strong>: ${input.statusAr}</p>
       ${input.note ? `<p>ملاحظة المحامي: ${input.note}</p>` : ''}
       <p><a href="${env.APP_URL}/requests">عرض الطلبات</a></p>`,
    ),
  )
}
