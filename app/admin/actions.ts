"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { renderDocx } from "@/lib/docgen";
import { notifyClientOfStatus } from "@/lib/notify";
import {
  formDataToOverrides,
  formDataToValues,
  getTemplate,
} from "@/lib/templates";

export type ReviewState = {
  error?: string;
  errors?: Record<string, string>;
  ok?: string;
  /** set after a successful generation so the form can link straight to the file */
  documentId?: string;
  filename?: string;
};

async function loadForReview(requestId: string) {
  const request = await db.caseRequest.findUnique({
    where: { id: requestId },
    include: { client: true, template: true, documents: true },
  });
  if (!request) return null;
  const template = getTemplate(request.templateKey);
  if (!template) return null;
  return { request, template };
}

/** Saves the lawyer's corrections without producing a document. */
export async function saveReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin();
  const requestId = (formData.get("requestId") ?? "").toString();

  const loaded = await loadForReview(requestId);
  if (!loaded) return { error: "الطلب غير موجود" };

  const parsed = loaded.template.schema.safeParse(
    formDataToValues(loaded.template, formData),
  );
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { error: "يرجى تصحيح الحقول المميزة.", errors };
  }

  const overrides = formDataToOverrides(loaded.template, formData);

  await db.caseRequest.update({
    where: { id: requestId },
    data: {
      reviewedData: {
        values: parsed.data,
        overrides,
      } as unknown as Prisma.InputJsonValue,
      status:
        loaded.request.status === "SUBMITTED"
          ? "UNDER_REVIEW"
          : loaded.request.status,
      lawyerNote: (formData.get("lawyerNote") ?? "").toString().trim() || null,
    },
  });

  await audit({
    actorId: admin.id,
    action: "request.reviewed",
    entity: "CaseRequest",
    entityId: requestId,
    meta: { reference: loaded.request.reference },
  });

  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: "تم حفظ التعديلات." };
}

/** Saves corrections and produces the .docx. */
export async function generateDocument(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireAdmin();
  const requestId = (formData.get("requestId") ?? "").toString();

  const loaded = await loadForReview(requestId);
  if (!loaded) return { error: "الطلب غير موجود" };

  const parsed = loaded.template.schema.safeParse(
    formDataToValues(loaded.template, formData),
  );
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { error: "لا يمكن إصدار الصحيفة قبل تصحيح الحقول المميزة.", errors };
  }

  const overrides = formDataToOverrides(loaded.template, formData);
  const placeholders = loaded.template.derive(parsed.data, overrides);

  // the .docx lives in CaseTemplate; an empty row means the seed never ran
  const templateBytes = loaded.request.template?.docx;
  if (!templateBytes || templateBytes.byteLength === 0) {
    console.error(
      "[generate] template row missing or empty",
      loaded.request.templateKey,
    );
    return {
      error:
        "قالب الصحيفة غير محمّل في قاعدة البيانات. شغّل «npm run db:seed» ثم أعد المحاولة.",
    };
  }

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = renderDocx(templateBytes, placeholders);
  } catch (error) {
    console.error("[generate] render failed", error);
    return {
      error: error instanceof Error ? error.message : "تعذر إنشاء المستند",
    };
  }

  const version = loaded.request.documents.length + 1;
  const filename = `${loaded.template.filenamePrefix}-${loaded.request.reference}-v${version}.docx`;

  // no explicit type argument here: naming one selects Prisma's callback
  // overload, and the array form then fails to match
  const [created] = await db.$transaction([
    db.document.create({
      data: {
        requestId,
        version,
        filename,
        bytes,
        generatedById: admin.id,
      },
      select: { id: true },
    }),
    db.caseRequest.update({
      where: { id: requestId },
      data: {
        reviewedData: {
          values: parsed.data,
          overrides,
        } as unknown as Prisma.InputJsonValue,
        status: "GENERATED",
        lawyerNote:
          (formData.get("lawyerNote") ?? "").toString().trim() || null,
      },
    }),
  ]);

  await audit({
    actorId: admin.id,
    action: "document.generated",
    entity: "CaseRequest",
    entityId: requestId,
    meta: { reference: loaded.request.reference, version, filename },
  });

  await notifyClientOfStatus({
    to: loaded.request.client.email,
    reference: loaded.request.reference,
    statusAr: "تم إصدار الصحيفة وهي متاحة للتحميل.",
    note: loaded.request.lawyerNote,
  });

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin");
  return {
    ok: `تم إصدار الصحيفة (نسخة ${version}).`,
    documentId: created.id,
    filename,
  };
}

/**
 * One entry point for the review form. The intent arrives in a hidden field the
 * buttons set on click — NOT on the submit button's own name/value, which is not
 * reliably present in the FormData a server action receives.
 */
export async function submitReview(
  prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const intent = (formData.get("intent") ?? "").toString();

  if (intent !== "generate" && intent !== "save") {
    console.error("[review] unexpected intent value", JSON.stringify(intent));
    return { error: "تعذر تحديد الإجراء المطلوب. حدّث الصفحة وأعد المحاولة." };
  }

  return intent === "generate"
    ? generateDocument(prev, formData)
    : saveReview(prev, formData);
}

export async function rejectRequest(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = (formData.get("requestId") ?? "").toString();
  const note = (formData.get("lawyerNote") ?? "").toString().trim();

  const request = await db.caseRequest.findUnique({
    where: { id: requestId },
    include: { client: true },
  });
  if (!request) return;

  await db.caseRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", lawyerNote: note || null },
  });

  await audit({
    actorId: admin.id,
    action: "request.rejected",
    entity: "CaseRequest",
    entityId: requestId,
    meta: { reference: request.reference, note },
  });

  await notifyClientOfStatus({
    to: request.client.email,
    reference: request.reference,
    statusAr: "تمت إعادة الطلب، يرجى مراجعة ملاحظات المحامي.",
    note: note || null,
  });

  revalidatePath("/admin");
  redirect("/admin");
}
