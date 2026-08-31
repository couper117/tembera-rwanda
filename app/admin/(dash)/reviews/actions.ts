"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { PLACES_TAG } from "@/lib/data/places";

/**
 * Review moderation.
 *
 * Hiding rather than deleting: the row survives, the author still has their
 * words, and the decision can be undone. A moderator who can only delete has
 * to be certain, which in practice means either being too slow or being wrong
 * irreversibly.
 */

const hideSchema = z.object({
  id: z.coerce.number().int().positive(),
  hidden: z.enum(["true", "false"]),
});

/**
 * A hidden review must also stop counting towards the place's rating —
 * otherwise moderating abuse still leaves its one star in the average, and the
 * moderator has no way to see why the number will not move.
 */
async function recomputeRating(placeId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { placeId, hidden: false },
    _avg: { rating: true },
  });
  await prisma.place.update({
    where: { id: placeId },
    data: { rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null },
  });
}

export async function setReviewHiddenAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const parsed = hideSchema.safeParse({
    id: formData.get("id"),
    hidden: formData.get("hidden"),
  });
  if (!parsed.success) return;

  const hidden = parsed.data.hidden === "true";
  const review = await prisma.review.update({
    where: { id: parsed.data.id },
    data: { hidden },
    select: { placeId: true, rating: true },
  });

  await recomputeRating(review.placeId);

  await recordAudit({
    actorId: staff.id,
    action: hidden ? "review.hide" : "review.show",
    entity: "review",
    entityId: String(parsed.data.id),
    meta: { placeId: review.placeId, rating: review.rating },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath("/admin/reviews");
  revalidatePath(`/place/${review.placeId}`);
}
