"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PLACES_TAG } from "@/lib/data/places";
import { reviewSchema } from "@/lib/validation/review";

/* ------------------------------------------------------------ saved */

export async function toggleSaveAction(
  placeId: string,
): Promise<{ saved: boolean } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save places." };

  const existing = await prisma.savedPlace.findUnique({
    where: { userId_placeId: { userId: user.id, placeId } },
  });

  if (existing) {
    await prisma.savedPlace.delete({ where: { id: existing.id } });
  } else {
    // Ignore a race / bad id gracefully.
    await prisma.savedPlace
      .create({ data: { userId: user.id, placeId } })
      .catch(() => {});
  }

  revalidatePath("/saved");
  revalidatePath("/profile");
  return { saved: !existing };
}

export async function clearSavedAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.savedPlace.deleteMany({ where: { userId: user.id } });
  revalidatePath("/saved");
  revalidatePath("/profile");
}

/* ----------------------------------------------------------- visited */

export async function recordVisitAction(placeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !placeId) return;
  await prisma.visitedPlace
    .upsert({
      where: { userId_placeId: { userId: user.id, placeId } },
      create: { userId: user.id, placeId },
      update: { visitedAt: new Date() },
    })
    .catch(() => {});
}

export async function clearVisitedAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.visitedPlace.deleteMany({ where: { userId: user.id } });
  revalidatePath("/profile");
}

/* ----------------------------------------------------------- profile */

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]{1,24}$/, "Handle can only contain letters and numbers."),
  email: z.string().trim().toLowerCase().email(),
  bio: z.string().trim().max(280),
  homeCity: z.string().trim().max(60),
});

export async function updateProfileAction(
  edits: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const parsed = profileSchema.safeParse(edits);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }
  const data = parsed.data;

  // Uniqueness on the changed handle/email.
  if (data.handle !== user.handle) {
    const taken = await prisma.user.findUnique({ where: { handle: data.handle } });
    if (taken) return { error: "That handle is taken." };
  }
  if (data.email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: data.email } });
    if (taken) return { error: "That email is already in use." };
  }

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}

/* ----------------------------------------------------------- reviews */

export async function submitReviewAction(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to leave a review." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }
  const { placeId, rating, body } = parsed.data;

  await prisma.review.upsert({
    where: { userId_placeId: { userId: user.id, placeId } },
    create: { userId: user.id, placeId, rating, body },
    update: { rating, body },
  });

  // A place's displayed rating becomes the average of its reviews.
  const agg = await prisma.review.aggregate({
    where: { placeId },
    _avg: { rating: true },
  });
  if (agg._avg.rating !== null) {
    await prisma.place.update({
      where: { id: placeId },
      data: { rating: Math.round(agg._avg.rating * 10) / 10 },
    });
  }

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  return { ok: true };
}

export async function deleteReviewAction(
  placeId: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  await prisma.review
    .delete({ where: { userId_placeId: { userId: user.id, placeId } } })
    .catch(() => {});

  const agg = await prisma.review.aggregate({
    where: { placeId },
    _avg: { rating: true },
  });
  await prisma.place.update({
    where: { id: placeId },
    data: { rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  return { ok: true };
}
