"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PRICES: Record<string, number> = {
  "Gorilla Trekking": 1500,
  "Akagera Safari": 150,
  "Nyungwe Canopy": 60,
};

// `guests` reaches the database as a Postgres int4, and so does the price it
// multiplies. Without a ceiling, a large enough party size overflows the column
// and the user gets a 500 instead of "that's too many people".
//
// 20 mirrors the stepper's own limit in booking/page.tsx — keep the two in step.
// The form cannot exceed it, but the form is not the authority: this action is
// reachable directly.
const MAX_GUESTS = 20;

// A booking for a date in the past is always a mistake, and one decades out is
// not a real request. Both are cheap to reject here.
const MAX_DAYS_AHEAD = 730;

export type BookingResult =
  | { ok: true; id: number; total: number }
  | { ok: false; error: string };

// Persists a booking request. The legacy booking form was front-end only and
// never sent anything to a server — this is net-new behaviour.
export async function createBooking(formData: FormData): Promise<BookingResult> {
  const experience = String(formData.get("experience") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const guests = Number(formData.get("guests") ?? 0);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  // Price is derived server-side from a trusted table, never from the client.
  const pricePer = PRICES[experience];
  if (pricePer === undefined) return { ok: false, error: "Invalid experience." };
  if (!dateStr) return { ok: false, error: "Please choose a date." };
  if (!Number.isInteger(guests) || guests < 1)
    return { ok: false, error: "Guest count must be at least 1." };
  if (guests > MAX_GUESTS)
    return {
      ok: false,
      error: `We can take up to ${MAX_GUESTS} guests per booking. For a larger group, get in touch directly.`,
    };
  if (!fullName) return { ok: false, error: "Full name is required." };
  if (fullName.length > 120)
    return { ok: false, error: "Please use a shorter name." };
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "A valid email is required." };

  const preferredAt = new Date(dateStr);
  if (Number.isNaN(preferredAt.getTime()))
    return { ok: false, error: "Invalid date." };

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (preferredAt < startOfToday)
    return { ok: false, error: "Please choose a date in the future." };

  const latest = new Date(startOfToday);
  latest.setDate(latest.getDate() + MAX_DAYS_AHEAD);
  if (preferredAt > latest)
    return { ok: false, error: "Please choose a date within the next two years." };

  const total = pricePer * guests;

  // Attach the current user if signed in; anonymous bookings keep userId null.
  const userId = (await getCurrentUser())?.id ?? null;

  const booking = await prisma.booking.create({
    data: { experience, preferredAt, guests, fullName, email, totalPrice: total, userId },
  });

  return { ok: true, id: booking.id, total };
}
