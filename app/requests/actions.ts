"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { nextReference } from "@/lib/counter";
import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { notifyAdminOfNewRequest } from "@/lib/notify";
import { formDataToValues, getTemplate } from "@/lib/templates";

export type RequestFormState = {
  error?: string;
  errors?: Record<string, string>;
  values?: Record<string, unknown>;
};

export async function submitRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  // Server Functions are reachable directly, so authorisation is re-checked here.
  const user = await requireUser();

  const templateKey = (formData.get("templateKey") ?? "").toString();
  const template = getTemplate(templateKey);
  if (!template) return { error: "نوع الصحيفة غير معروف" };

  const raw = formDataToValues(template, formData);
  const parsed = template.schema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { error: "يرجى تصحيح الحقول المميزة بالأحمر.", errors, values: raw };
  }

  const clientNote = (formData.get("clientNote") ?? "")
    .toString()
    .trim()
    .slice(0, 2000);

  const created = await db.$transaction<{ id: string; reference: string }>(
    async (tx: Prisma.TransactionClient) => {
      const reference = await nextReference(tx);
      return tx.caseRequest.create({
        data: {
          reference,
          templateKey: template.key,
          clientId: user.id,
          data: parsed.data as unknown as Prisma.InputJsonValue,
          clientNote: clientNote || null,
        },
        select: { id: true, reference: true },
      });
    },
  );

  await audit({
    actorId: user.id,
    action: "request.submitted",
    entity: "CaseRequest",
    entityId: created.id,
    meta: { reference: created.reference, templateKey: template.key },
  });

  await notifyAdminOfNewRequest({
    reference: created.reference,
    clientName: user.fullName,
    templateName: template.nameAr,
  });

  revalidatePath("/requests");
  redirect(`/requests?submitted=${encodeURIComponent(created.reference)}`);
}
