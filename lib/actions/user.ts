"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  revokeAllSessions,
  verifyPassword,
} from "@/lib/auth";
import { PLACES_TAG } from "@/lib/data/places";

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

/* ---------------------------------------------------------- password */

const passwordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(8, "New password must be at least 8 characters."),
});

export async function changePasswordAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  // Proving knowledge of the current password is what stops someone who has
  // walked up to an unlocked browser from locking the real owner out.
  const ok = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  if (parsed.data.next === parsed.data.current) {
    return { error: "New password must be different from the current one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  // Changing a password is how someone responds to a session they think was
  // stolen, so it has to end that session. This invalidates every cookie
  // issued so far — including this browser's — and then re-issues one, so the
  // person who just proved they know the password stays signed in and
  // everybody else does not.
  await revokeAllSessions(user.id);
  await createSession(user.id);

  return { ok: true };
}

/**
 * Sign out everywhere, including here. Useful when a device is lost and the
 * password itself is not believed to be compromised.
 */
export async function signOutEverywhereAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  await revokeAllSessions(user.id);
  await destroySession();
  redirect("/login");
}

/* ------------------------------------------------- data rights (GDPR-style) */

/**
 * Everything Tembera holds about the signed-in user, as a plain object.
 *
 * Required in substance by Rwanda's Law No. 058/2021 (the data subject's right
 * of access). The password hash is deliberately excluded — it is our record,
 * not their data, and returning it only creates a cracking target.
 */
export async function exportMyDataAction(): Promise<
  { ok: true; data: unknown } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const [saves, visits, reviews, bookings] = await Promise.all([
    prisma.savedPlace.findMany({
      where: { userId: user.id },
      select: { placeId: true, createdAt: true, place: { select: { name: true } } },
    }),
    prisma.visitedPlace.findMany({
      where: { userId: user.id },
      select: { placeId: true, visitedAt: true, place: { select: { name: true } } },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      select: { placeId: true, rating: true, body: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { userId: user.id },
      select: {
        experience: true,
        preferredAt: true,
        guests: true,
        fullName: true,
        email: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        handle: user.handle,
        name: user.name,
        bio: user.bio,
        homeCity: user.homeCity,
        role: user.role,
        createdAt: user.createdAt,
      },
      savedPlaces: saves.map((s) => ({
        place: s.place.name,
        placeId: s.placeId,
        savedAt: s.createdAt,
      })),
      visitedPlaces: visits.map((v) => ({
        place: v.place.name,
        placeId: v.placeId,
        visitedAt: v.visitedAt,
      })),
      reviews,
      bookings,
    },
  };
}

/**
 * Erase the account and everything attached to it.
 *
 * Saves, visits and reviews cascade from the schema. Bookings deliberately do
 * not: they are a commercial record the business may be required to keep, so
 * `userId` is set to null and the row survives without pointing at a person.
 */
export async function deleteMyAccountAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (confirm !== "DELETE") {
    return { error: 'Type DELETE in the confirmation box to continue.' };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Password is incorrect." };

  // An admin deleting themselves could leave the dashboard unreachable.
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return {
        error:
          "This is the only admin account. Promote another admin before deleting it.",
      };
    }
  }

  await prisma.booking.updateMany({
    where: { userId: user.id },
    data: { userId: null },
  });
  await prisma.user.delete({ where: { id: user.id } });

  await destroySession();
  revalidateTag(PLACES_TAG); // their reviews fed place ratings
  redirect("/?deleted=1");
}

/* ----------------------------------------------------------- reviews */

const reviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional().default(""),
});

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
