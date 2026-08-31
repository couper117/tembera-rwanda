"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { PLACES_TAG } from "@/lib/data/places";
import { isSensitivePlace } from "@/lib/places/engine";
import { reviewSchema } from "@/lib/validation/review";

/**
 * Everything a signed-in person does to their own data.
 *
 * Every action here begins by resolving the user server-side and acting only
 * on that id. None of them accept a user id from the client: a server action is
 * a POST endpoint that anyone can call with any body, so trusting an id in the
 * payload would let one account edit another's.
 */

/**
 * Bump the token version, which invalidates every JWT already issued for this
 * account — see the note in lib/auth.ts. There is no session table to sweep;
 * the cookie carries the version it was minted at and stops matching.
 */
async function revokeAllSessions(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

/* ------------------------------------------------------------------ saved */

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
    // A bad or archived place id must not 500 the save button.
    const created = await prisma.savedPlace
      .create({ data: { userId: user.id, placeId } })
      .catch(() => null);
    if (!created) return { error: "That place could not be saved." };
  }

  revalidatePath("/saved");
  revalidatePath("/profile");
  return { saved: !existing };
}

export async function clearSavedAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  await prisma.savedPlace.deleteMany({ where: { userId: user.id } });
  revalidatePath("/saved");
  revalidatePath("/profile");
  return {};
}

/* ---------------------------------------------------------------- visited */

export async function recordVisitAction(placeId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || !placeId) return { error: "Not signed in." };

  // Upsert, not create: opening a place again updates when you were last
  // there rather than adding a second row.
  const ok = await prisma.visitedPlace
    .upsert({
      where: { userId_placeId: { userId: user.id, placeId } },
      create: { userId: user.id, placeId },
      update: { visitedAt: new Date() },
    })
    .catch(() => null);
  return ok ? {} : { error: "That visit could not be recorded." };
}

export async function clearVisitedAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  await prisma.visitedPlace.deleteMany({ where: { userId: user.id } });
  revalidatePath("/profile");
  return {};
}

/* ---------------------------------------------------------------- profile */

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

/* --------------------------------------------------------------- password */

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

  // The hash is never on the session object, so read it here rather than
  // widening what getCurrentUser() hands to every screen.
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row) return { error: "Not signed in." };

  // Proving knowledge of the current password is what stops someone who has
  // walked up to an unlocked browser from locking the real owner out.
  if (!(await verifyPassword(parsed.data.current, row.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  if (parsed.data.next === parsed.data.current) {
    return { error: "New password must be different from the current one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  // Changing a password is how someone responds to a session they believe was
  // stolen, so it has to end that session. Revoking invalidates every token
  // issued so far — including this browser's — and signing back in immediately
  // re-issues one, so the person who just proved they know the password stays
  // put and everybody else is out.
  await revokeAllSessions(user.id);
  await signIn("credentials", {
    email: user.email,
    password: parsed.data.next,
    redirect: false,
  });

  return { ok: true };
}

/**
 * Sign out everywhere, including here. For a lost device, where the password
 * itself is not believed to be compromised.
 */
export async function signOutEverywhereAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  await revokeAllSessions(user.id);
  await signOut({ redirectTo: "/login" });
  return {};
}

/* ---------------------------------------------------------- data rights */

/**
 * Everything Tembera holds about the signed-in user, as a plain object.
 *
 * Required in substance by Rwanda's Law No. 058/2021 (the data subject's right
 * of access). The password hash is deliberately excluded — it is our record,
 * not their data, and returning it only creates something worth cracking.
 */
export async function exportMyDataAction(): Promise<
  { ok: true; data: unknown } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const [saves, visits, reviews] = await Promise.all([
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
    },
  };
}

/**
 * Erase the account and everything attached to it. Saves, visits and reviews
 * cascade from the schema.
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
    return { error: "Type DELETE in the confirmation box to continue." };
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row) return { error: "Not signed in." };
  if (!(await verifyPassword(password, row.passwordHash))) {
    return { error: "Password is incorrect." };
  }

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

  await prisma.user.delete({ where: { id: user.id } });

  revalidateTag(PLACES_TAG); // their reviews fed place ratings
  await signOut({ redirectTo: "/?deleted=1" });
  return {};
}

/* ---------------------------------------------------------------- reviews */

/**
 * Recompute a place's displayed rating from its reviews.
 *
 * A place with no reviews left goes back to null rather than keeping the last
 * average, which would be a number with nothing behind it.
 */
async function recomputeRating(placeId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { placeId },
    _avg: { rating: true },
  });
  await prisma.place.update({
    where: { id: placeId },
    data: { rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null },
  });
}

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

  // The other half of the sensitive-category rule. Reads strip ratings and
  // reviews from memorial sites at source, but that only stops them being
  // shown — a hand-crafted POST could still write one. Rating a place of
  // remembrance out of five is not a display bug to be hidden; it must not be
  // storable at all.
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { categoryId: true, sensitive: true, category: { select: { sensitive: true } } },
  });
  if (!place) return { error: "That place no longer exists." };
  if (isSensitivePlace(place) || place.category.sensitive) {
    return { error: "This is a place of remembrance. It is not reviewed or rated." };
  }

  await prisma.review.upsert({
    where: { userId_placeId: { userId: user.id, placeId } },
    create: { userId: user.id, placeId, rating, body },
    update: { rating, body },
  });

  await recomputeRating(placeId);
  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  return { ok: true };
}

export async function deleteReviewAction(
  placeId: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();

  await prisma.review
    .delete({ where: { userId_placeId: { userId: user.id, placeId } } })
    .catch(() => {});

  await recomputeRating(placeId);
  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  return { ok: true };
}
