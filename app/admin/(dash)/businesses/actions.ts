"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/**
 * Business standing.
 *
 * ADMIN only, not staff: verifying a business is a statement that Tembera has
 * checked who they are, and suspending one takes away their ability to publish.
 * Neither is a catalogue edit.
 */

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["unverified", "verified", "suspended"]),
});

export async function setBusinessStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const updated = await prisma.business
    .update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
      select: { name: true },
    })
    .catch(() => null);
  if (!updated) return;

  await recordAudit({
    actorId: admin.id,
    action: `business.${parsed.data.status}`,
    entity: "business",
    entityId: String(parsed.data.id),
    meta: { name: updated.name },
  });

  revalidatePath("/admin/businesses");
}
