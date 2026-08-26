"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["open", "resolved", "dismissed"]),
});

/** Mark a report handled. Guarded like every other admin mutation. */
export async function setReportStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.report.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      // Cleared when reopened, so the timestamp always means "when it was
      // last closed" rather than "when it was last touched".
      handledAt: parsed.data.status === "open" ? null : new Date(),
    },
  });

  revalidatePath("/admin/reports");
}

export async function deleteReportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.report.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/reports");
}
