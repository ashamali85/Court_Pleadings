import { templates } from '@/lib/templates'

/**
 * Every user-visible string in the app, with its built-in Arabic wording.
 *
 * The admin content screen (/admin/content) edits these. A SiteText row is
 * written only when the wording is changed, so removing the row restores what
 * is written here. Field and section labels are derived from the template
 * definitions below, so a new case type gets editable labels automatically.
 */

export const CONTENT_GROUPS: { key: string; titleAr: string }[] = [
  { key: 'common', titleAr: 'عناصر عامة' },
  { key: 'nav', titleAr: 'الشريط العلوي' },
  { key: 'login', titleAr: 'صفحة الدخول' },
  { key: 'client', titleAr: 'صفحات العميل' },
  { key: 'admin', titleAr: 'صفحات المحامي' },
  { key: 'status', titleAr: 'حالات الطلب' },
  { key: 'message', titleAr: 'الرسائل والتنبيهات' },
  { key: 'section', titleAr: 'عناوين أقسام النموذج' },
  { key: 'field', titleAr: 'حقول النموذج' },
  { key: 'override', titleAr: 'حقول التجاوز اليدوي' },
  { key: 'template', titleAr: 'أنواع الصحف' },
]

const STATIC_DEFAULTS: Record<string, string> = {
  // ---------- common ----------
  'common.appName': 'مكتب المحاماة — نظام الطلبات',
  'common.tagline': 'تقديم طلبات الدعاوى وإصدار الصحف القانونية',
  'common.loading': 'جارٍ التحميل…',
  'common.save': 'حفظ',
  'common.download': 'تحميل',
  'common.back': 'رجوع',
  'common.optional': 'اختياري',
  'common.none': '—',
  'common.roleAdmin': 'محامٍ',
  'common.roleClient': 'عميل',

  // ---------- nav ----------
  'nav.myRequests': 'طلباتي',
  'nav.newRequest': 'طلب جديد',
  'nav.inbox': 'الطلبات الواردة',
  'nav.content': 'نصوص الموقع',
  'nav.logout': 'تسجيل الخروج',

  // ---------- login ----------
  'login.title': 'تسجيل الدخول',
  'login.subtitle': 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.',
  'login.email': 'البريد الإلكتروني',
  'login.password': 'كلمة المرور',
  'login.submit': 'دخول',
  'login.loading': 'جارٍ التحقق…',

  // ---------- client ----------
  'client.list.title': 'طلباتي',
  'client.list.subtitle': 'تابع حالة طلباتك، وحمّل الصحيفة بعد اعتمادها من المحامي.',
  'client.list.newBtn': 'تقديم طلب جديد',
  'client.list.colRef': 'الرقم المرجعي',
  'client.list.colType': 'نوع الصحيفة',
  'client.list.colDate': 'تاريخ التقديم',
  'client.list.colStatus': 'الحالة',
  'client.list.colDoc': 'المستند',
  'client.list.empty': 'لا توجد طلبات بعد.',
  'client.list.editBtn': 'تعديل الطلب وإعادة إرساله',
  'client.list.rejectionLabel': 'سبب الإعادة',
  'client.new.noteSection': 'ملاحظات إضافية',
  'client.new.noteLabel': 'ملاحظات للمحامي (اختياري)',
  'client.new.submitBtn': 'إرسال الطلب',
  'client.new.submitHint':
    'بعد الإرسال يراجع المحامي البيانات ويصدر الصحيفة بصيغة Word.',
  'client.edit.title': 'تعديل الطلب',
  'client.edit.notice': 'أعاد المحامي هذا الطلب لتعديله. صحّح البيانات ثم أعد إرساله.',
  'client.edit.submitBtn': 'إعادة إرسال الطلب',

  // ---------- admin ----------
  'admin.inbox.title': 'الطلبات الواردة',
  'admin.inbox.pending': 'طلب بانتظار المراجعة والإصدار.',
  'admin.inbox.noPending': 'لا توجد طلبات معلقة.',
  'admin.inbox.empty': 'لم يرد أي طلب بعد.',
  'admin.inbox.colClient': 'مقدم الطلب',
  'admin.inbox.colSummary': 'ملخص',
  'admin.inbox.reviewLink': 'مراجعة وإصدار',
  'admin.review.backBtn': 'رجوع للقائمة',
  'admin.review.clientNoteTitle': 'ملاحظات العميل',
  'admin.review.docsTitle': 'الصحف الصادرة',
  'admin.review.colVersion': 'النسخة',
  'admin.review.colFile': 'اسم الملف',
  'admin.review.colIssued': 'تاريخ الإصدار',
  'admin.review.computedTitle': 'النص المحتسب تلقائياً',
  'admin.review.computedHint':
    'هذه القيم تُحسب من الحقول أعلاه وتُكتب في الصحيفة. حدّث الصفحة بعد الحفظ لإعادة احتسابها، أو تجاوزها يدوياً من القسم التالي.',
  'admin.review.overrideTitle': 'تجاوز يدوي (اختياري)',
  'admin.review.overrideHint':
    'اترك الحقل فارغاً للإبقاء على القيمة المحتسبة تلقائياً.',
  'admin.review.noteTitle': 'ملاحظة المحامي وإصدار الصحيفة',
  'admin.review.generateBtn': 'إصدار الصحيفة (Word)',
  'admin.review.generateLoading': 'جارٍ إنشاء الصحيفة…',
  'admin.review.saveBtn': 'حفظ التعديلات فقط',
  'admin.review.rejectTitle': 'إعادة الطلب للعميل',
  'admin.review.rejectReasonLabel': 'سبب الإعادة (إلزامي — يظهر للعميل)',
  'admin.review.rejectBtn': 'إعادة الطلب للعميل',
  'admin.review.downloadLink': 'تحميل الملف',
  'admin.content.title': 'نصوص الموقع',
  'admin.content.subtitle':
    'كل نص يظهر للمستخدمين يمكن تعديله من هنا. اترك الحقل فارغاً لاستعادة النص الأصلي.',
  'admin.content.searchLabel': 'بحث في النصوص',
  'admin.content.saveBtn': 'حفظ النصوص',
  'admin.content.savedMsg': 'تم حفظ النصوص.',
  'admin.content.defaultLabel': 'النص الأصلي:',
  'admin.content.modifiedBadge': 'معدّل',

  // ---------- statuses ----------
  'status.SUBMITTED': 'قيد الانتظار',
  'status.UNDER_REVIEW': 'قيد المراجعة',
  'status.GENERATED': 'تم إصدار الصحيفة',
  'status.REJECTED': 'مُعاد للتعديل',

  // ---------- messages ----------
  'message.loginFailed': 'بيانات الدخول غير صحيحة أو الحساب غير مفعّل',
  'message.submitted':
    'تم استلام طلبك برقم {ref}. سيتولى المحامي مراجعته وإعداد الصحيفة.',
  'message.updated': 'تم إعادة إرسال الطلب {ref} للمحامي.',
  'message.fixFields': 'يرجى تصحيح الحقول المميزة بالأحمر.',
  'message.cannotGenerate': 'لا يمكن إصدار الصحيفة قبل تصحيح الحقول المميزة.',
  'message.saved': 'تم حفظ التعديلات.',
  'message.generated': 'تم إصدار الصحيفة (نسخة {version}).',
  'message.templateMissing':
    'قالب الصحيفة غير محمّل في قاعدة البيانات. شغّل «npm run db:seed» ثم أعد المحاولة.',
  'message.renderFailed': 'تعذر إنشاء المستند',
  'message.notFound': 'الطلب غير موجود',
  'message.intentUnknown': 'تعذر تحديد الإجراء المطلوب. حدّث الصفحة وأعد المحاولة.',
  'message.rejectReasonRequired': 'يجب ذكر سبب إعادة الطلب للعميل.',
  'message.rejected': 'تمت إعادة الطلب للعميل.',
  'message.needsFix': 'يحتاج تصحيحاً',
}

/** Built-in wording for every key, including the ones derived from templates. */
export function contentDefaults(): Record<string, string> {
  const out: Record<string, string> = { ...STATIC_DEFAULTS }

  for (const template of templates) {
    out[`template.${template.key}.name`] = template.nameAr
    out[`template.${template.key}.description`] = template.descriptionAr

    for (const section of template.sections) {
      out[`section.${template.key}.${section.key}.title`] = section.titleAr

      for (const field of section.fields) {
        out[`field.${template.key}.${field.name}.label`] = field.labelAr
        if (field.hintAr) out[`field.${template.key}.${field.name}.hint`] = field.hintAr
        if (field.placeholder) {
          out[`field.${template.key}.${field.name}.placeholder`] = field.placeholder
        }
      }
    }

    for (const item of template.overridable) {
      out[`override.${template.key}.${item.name}.label`] = item.labelAr
    }
  }

  return out
}

export type ContentMap = Record<string, string>
