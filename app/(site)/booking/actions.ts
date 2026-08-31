"use server";

const PRICES: Record<string, number> = {
  "Gorilla Trekking": 1500,
  "Akagera Safari": 150,
  "Nyungwe Canopy": 60,
};

export type BookingResult =
  | { ok: true; id: number; total: number }
  | { ok: false; error: string };

/**
 * Booking, with the backend removed.
 *
 * Nothing is persisted: there is no bookings table to write to. The experience
 * is still validated against the trusted price table so the form's own error
 * path stays exercised, and a genuine request is then turned down honestly
 * rather than being silently dropped and shown a confirmation.
 */
export async function createBooking(formData: FormData): Promise<BookingResult> {
  const experience = String(formData.get("experience") ?? "");
  if (PRICES[experience] === undefined) {
    return { ok: false, error: "Invalid experience." };
  }
  return {
    ok: false,
    error:
      "Booking is not connected yet — this build has no backend, so your request was not sent. Please contact the operator directly.",
  };
}
