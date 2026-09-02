"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PLACES_TAG } from "@/lib/data/places";
import { kebab } from "@/lib/validation/admin";
import {
  businessNewPlaceSchema,
  businessPlaceSchema,
} from "@/lib/validation/business";

/**
 * Deciding on what a business has sent in.
 *
 * This is the only place ownership of a listing is ever granted. A business
 * cannot assign itself a place; approving a submission is what does it, and
 * that decision is a staff one.
 */

/** Same shape as the admin's own id generation, so a promoted listing is
 *  indistinguishable from a seeded one. */
async function uniquePlaceId(categoryId: string, name: string): Promise<string> {
  const base = kebab(`${categoryId}-${name}`) || "place";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await prisma.place.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
}

function fail(id: number, message: string): never {
  redirect(`/admin/submissions/${id}?error=${encodeURIComponent(message)}`);
}

/**
 * Approve.
 *
 * Everything happens in one transaction: creating the place, assigning its
 * owner, closing the submission. A partial success here is the worst outcome
 * available — a published listing nobody owns, or a business told its listing
 * is live when it does not exist. This is why the WebSocket Neon driver was
 * chosen rather than the HTTP one, which cannot do interactive transactions.
 *
 * The payload is re-validated on the way out. It was validated on the way in,
 * but it has been sitting in a JSON column since, and a schema that only runs
 * at one end is a schema you are trusting the database to have preserved.
 */
export async function approveSubmissionAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { business: true },
  });
  if (!submission) return;
  if (submission.status !== "pending") fail(id, "That submission has already been decided.");

  if (submission.kind === "create") {
    const parsed = businessNewPlaceSchema.safeParse(submission.payload);
    if (!parsed.success) {
      fail(id, "The proposal is no longer valid — ask the business to send it again.");
    }
    const d = parsed.data;
    const placeId = await uniquePlaceId(d.categoryId, d.name);
    const { hoursJson, ...rest } = d;

    await prisma.$transaction(async (tx) => {
      await tx.place.create({
        data: {
          ...rest,
          id: placeId,
          hoursJson: hoursJson ?? Prisma.DbNull,
          businessId: submission.businessId,
          status: "published",
        },
      });
      await tx.submission.update({
        where: { id },
        data: {
          status: "approved",
          reviewedByUserId: staff.id,
          reviewedAt: new Date(),
          placeId,
        },
      });
    });

    await recordAudit({
      actorId: staff.id,
      action: "submission.approve",
      entity: "submission",
      entityId: String(id),
      meta: { kind: "create", placeId, businessId: submission.businessId },
    });

    revalidateTag(PLACES_TAG);
    redirect(`/admin/places/${placeId}`);
  }

  // An edit to a listing the business already owns.
  if (!submission.placeId) fail(id, "That change has no listing attached.");

  const parsed = businessPlaceSchema.safeParse(submission.payload);
  if (!parsed.success) {
    fail(id, "The proposed change is no longer valid — ask the business to send it again.");
  }
  const { hoursJson, ...rest } = parsed.data;
  const placeId = submission.placeId;

  await prisma.$transaction(async (tx) => {
    await tx.place.update({
      where: { id: placeId },
      data: { ...rest, hoursJson: hoursJson ?? Prisma.DbNull },
    });
    await tx.submission.update({
      where: { id },
      data: { status: "approved", reviewedByUserId: staff.id, reviewedAt: new Date() },
    });
  });

  await recordAudit({
    actorId: staff.id,
    action: "submission.approve",
    entity: "submission",
    entityId: String(id),
    meta: { kind: "edit", placeId, businessId: submission.businessId },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  redirect(`/admin/places/${placeId}`);
}

/**
 * Reject, with a reason.
 *
 * The reason is required rather than optional: it is the only thing the
 * business sees, and "rejected" with no explanation produces a resubmission of
 * the same thing and a phone call.
 */
export async function rejectSubmissionAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isInteger(id)) return;
  if (reason.length < 5) fail(id, "Give the business a reason they can act on.");

  const updated = await prisma.submission
    .update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: reason,
        reviewedByUserId: staff.id,
        reviewedAt: new Date(),
      },
      select: { businessId: true },
    })
    .catch(() => null);
  if (!updated) return;

  await recordAudit({
    actorId: staff.id,
    action: "submission.reject",
    entity: "submission",
    entityId: String(id),
    meta: { businessId: updated.businessId, reason },
  });

  revalidatePath("/admin/submissions");
  redirect("/admin/submissions");
}
