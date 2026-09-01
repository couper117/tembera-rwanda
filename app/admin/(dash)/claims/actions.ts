"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["pending", "approved", "rejected"]),
});

/**
 * Decide a business's claim on a listing. Guarded like every other admin
 * mutation.
 *
 * Approving records a decision, nothing more — no money changes hands here and
 * no ownership is transferred yet. Someone still calls the business to confirm
 * it is theirs, which is exactly what the public form promises.
 */
export async function setClaimStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.businessClaim.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      // Cleared when returned to pending, so the timestamp always means "when
      // it was decided" rather than "when it was last touched".
      handledAt: parsed.data.status === "pending" ? null : new Date(),
    },
  });

  revalidatePath("/admin/claims");
  revalidatePath("/admin");
}

export async function deleteClaimAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.businessClaim.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/claims");
  revalidatePath("/admin");
}
