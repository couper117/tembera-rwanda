"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

/**
 * Triage for problems visitors report about a listing.
 *
 * Every action starts with requireStaff(). The layout already gates the pages,
 * but a server action is its own POST endpoint — reachable by anyone who can
 * craft a request, whether or not the button was ever rendered.
 */

const statusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["open", "resolved", "dismissed"]),
});

export async function setReportStatusAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { id, status } = parsed.data;
  const updated = await prisma.report.update({
    where: { id },
    data: {
      status,
      // Stamped when it leaves the queue, cleared if it is reopened, so
      // "handled" always means what it says.
      handledAt: status === "open" ? null : new Date(),
    },
    select: { placeId: true },
  });

  await recordAudit({
    actorId: staff.id,
    action: `report.${status}`,
    entity: "report",
    entityId: String(id),
    meta: { placeId: updated.placeId },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

const idSchema = z.object({ id: z.coerce.number().int().positive() });

/**
 * Deleting a report is genuinely destructive: it is somebody's correction, and
 * the record of why a listing changed. Resolving or dismissing is almost
 * always the right verb — this exists for spam.
 */
export async function deleteReportAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const report = await prisma.report
    .delete({ where: { id: parsed.data.id }, select: { placeId: true, kind: true, body: true } })
    .catch(() => null);
  if (!report) return;

  await recordAudit({
    actorId: staff.id,
    action: "report.delete",
    entity: "report",
    entityId: String(parsed.data.id),
    // The body is kept in the audit meta on purpose: the report row is gone,
    // and a deletion with no trace of what was deleted is not an audit trail.
    meta: { placeId: report.placeId, kind: report.kind, body: report.body },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
