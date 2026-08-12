"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PRICES: Record<string, number> = {
  "Gorilla Trekking": 1500,
  "Akagera Safari": 150,
  "Nyungwe Canopy": 60,
};

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
  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "A valid email is required." };

  const preferredAt = new Date(dateStr);
  if (Number.isNaN(preferredAt.getTime()))
    return { ok: false, error: "Invalid date." };

  const total = pricePer * guests;

  // Attach the current user if signed in; anonymous bookings keep userId null.
  const userId = (await getCurrentUser())?.id ?? null;

  const booking = await prisma.booking.create({
    data: { experience, preferredAt, guests, fullName, email, totalPrice: total, userId },
  });

  return { ok: true, id: booking.id, total };
}
