import { internalForms } from '@/lib/contracts'
import { templates } from '@/lib/templates'
import { baseFieldName } from '@/lib/templates/party'
import type { FieldDef, SectionDef } from '@/lib/templates/types'

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
  { key: 'contract', titleAr: 'عقود المكتب' },
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
  'common.working': 'جاري العمل',
  'common.today': 'اليوم',
  'common.clear': 'مسح',
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
  'nav.internal': 'الأعمال الداخلية',
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
  'admin.home.title': 'أهلاً {name}',
  'admin.home.subtitle': 'اختر ما تريد العمل عليه.',
  'admin.home.internalHint': 'أعمال المكتب التي لا تأتي من العملاء.',
  'admin.home.inboxHint': 'طلبات العملاء للمراجعة وإصدار الصحف.',
  'admin.home.contentHint': 'تعديل النصوص والعناوين الظاهرة في الموقع.',
  'admin.internal.subtitle': 'اختر العمل المطلوب.',
  'admin.internal.empty': 'لا توجد أعمال داخلية بعد.',
  'admin.internal.planned': 'قيد الإعداد',
  'admin.internal.plannedHint':
    'لم تُحدَّد تفاصيل هذا العمل بعد. سيُبنى هذا الصفحة عند ورود تعليمات المكتب.',
  'admin.jobs.title': 'إدارة الأعمال الداخلية',
  'admin.jobs.subtitle': 'أضف الأعمال التي يقوم بها المكتب، وأعد ترتيبها أو أخفها.',
  'admin.jobs.addTitle': 'إضافة عمل',
  'admin.jobs.addHint': 'يظهر العمل في القائمة فور إضافته، وله صفحته الخاصة.',
  'admin.jobs.name': 'اسم العمل',
  'admin.jobs.description': 'وصف مختصر (اختياري)',
  'admin.jobs.feature': 'ما يفتحه هذا العمل',
  'admin.jobs.featureHint':
    'اربط العمل بأحد النماذج الجاهزة ليُفتح النموذج في صفحته. اتركه «بدون نموذج» إذا كان العمل اسماً فقط.',
  'admin.jobs.featureNone': 'بدون نموذج (قيد الإعداد)',
  'admin.jobs.add': 'إضافة',
  'admin.jobs.added': 'تمت إضافة العمل.',
  'admin.jobs.nameRequired': 'اسم العمل مطلوب.',
  'admin.jobs.visible': 'يظهر في القائمة',
  'admin.jobs.visibleHint': 'إخفاء العمل يبقيه هنا ويخرجه من قائمة الأعمال الداخلية.',
  'admin.jobs.hidden': 'مخفي',
  'admin.jobs.hiddenNotice': 'هذا العمل مخفي ولا يظهر في قائمة الأعمال الداخلية.',
  'admin.jobs.moveUp': 'تحريك لأعلى',
  'admin.jobs.moveDown': 'تحريك لأسفل',
  'admin.jobs.remove': 'حذف العمل',
  'admin.jobs.confirmRemove': 'تأكيد الحذف نهائياً',
  'admin.jobs.cancel': 'إلغاء',
  'admin.jobs.deleted': 'تم حذف العمل.',
  'admin.jobs.empty': 'لا توجد أعمال بعد. أضف أول عمل من الأعلى.',
  'admin.jobs.addFirst': 'إضافة أول عمل',
  'admin.jobs.openJob': 'فتح صفحة العمل',
  'admin.internal.back': 'رجوع إلى الأعمال الداخلية',

  // ---------- contracts (الأعمال الداخلية) ----------
  'contract.generateBtn': 'إصدار العقد (Word)',
  'contract.generateLoading': 'جارٍ إنشاء العقد…',
  'contract.generateHint': 'يُنزَّل العقد بصيغة Word جاهزاً للمراجعة والتوقيع.',
  'contract.generated': 'تم إنشاء العقد وتنزيله.',
  'contract.failed': 'تعذر إنشاء العقد. راجع الحقول المميزة وأعد المحاولة.',
  'contract.blankBtn': 'تنزيل نموذج فارغ',
  'contract.blankHint':
    'نسخة بكل بنود العقد وخانات صفراء مكان البيانات، للطباعة والتعبئة باليد.',
  'contract.notStored':
    'لا يحتفظ النظام بنسخة من العقد بعد تنزيله، فاحفظ الملف في ملف القضية.',
  'client.new.chooseTitle': 'ما نوع الدعوى؟',
  'client.new.chooseHint': 'اختر نوع الدعوى لتظهر لك الأسئلة الخاصة بها.',
  'client.new.changeType': 'تغيير نوع الدعوى',
  // read out to screen readers as «شرح <اسم الدعوى>»
  'client.new.explain': 'شرح',
  'client.new.attachSection': 'المرفقات',
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
  'admin.review.attachTitle': 'مرفقات العميل',
  'admin.review.colAttachKind': 'المستند',
  'admin.review.colSize': 'الحجم',
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

/**
 * Every title, label, hint and placeholder of one form, keyed by its owner.
 *
 * Templates and the office's own internal forms (lib/contracts) are the same
 * shape here on purpose: a form is a list of sections of fields wherever it
 * came from, so neither kind has to be taught about the content screen.
 */
function collectSections(
  out: Record<string, string>,
  key: string,
  sections: SectionDef[],
) {
  for (const section of sections) {
    // a section's own title: «المدعي» is worded once, and the numbered copies
    // take their wording from it
    if (!section.repeat || section.repeat.index === 1) {
      out[`section.${key}.${section.key}.title`] = section.titleAr
    }

    // a repeatable group contributes its own label plus one per row field,
    // keyed field.<form>.<group>.<row field>.label
    const walk = (field: FieldDef, prefix: string) => {
      out[`${prefix}.label`] = field.labelAr
      // an alternative wording that depends on another answer is editable
      // too — «عنوان الجهة الحكومية» is as much the lawyer's word as the
      // label it replaces
      field.labelWhen?.forEach((alt, i) => {
        out[`${prefix}.label.when${i + 1}`] = alt.labelAr
      })
      if (field.hintAr) out[`${prefix}.hint`] = field.hintAr
      if (field.placeholder) out[`${prefix}.placeholder`] = field.placeholder
      for (const sub of field.rowFields ?? []) {
        walk(sub, `${prefix}.${sub.name}`)
      }
    }

    for (const field of section.fields) {
      // every party of a side asks the same questions, so they share one set
      // of labels; without this the lawyer would be shown four copies of
      // each and would have to edit every one
      walk(field, `field.${key}.${baseFieldName(field.name)}`)
    }
  }
}

/** Built-in wording for every key, including the ones derived from forms. */
export function contentDefaults(): Record<string, string> {
  const out: Record<string, string> = { ...STATIC_DEFAULTS }

  for (const template of templates) {
    out[`template.${template.key}.name`] = template.nameAr
    out[`template.${template.key}.description`] = template.descriptionAr

    collectSections(out, template.key, template.sections)

    for (const item of template.overridable) {
      out[`override.${template.key}.${item.name}.label`] = item.labelAr
    }
  }

  // الأعمال الداخلية — the office's own forms, worded from the same screen
  for (const form of internalForms) {
    out[`template.${form.key}.name`] = form.nameAr
    out[`template.${form.key}.description`] = form.descriptionAr
    collectSections(out, form.key, form.sections)
  }

  return out
}

export type ContentMap = Record<string, string>
