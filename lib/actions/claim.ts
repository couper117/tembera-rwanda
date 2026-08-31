"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, formatRetryAfter, rateLimit } from "@/lib/rate-limit";
import { PLAN_IDS } from "@/lib/business/plans";

// A business claiming its own listing.
//
// Deliberately open to signed-out visitors, for the same reason reporting a
// problem is: the owner of a restaurant should not have to create a visitor
// account before they can tell us the listing is theirs. Requiring one would
// mean the claim never arrives.
//
// That openness is also why it is rate limited — it is a public write path.
// The limiter keys on a client-supplied header, so it is a speed bump against
// scripted spam, not an identity check. An admin approves every claim before
// it means anything, which is where the real gate is.

const CLAIM_PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };

// Rwandan numbers arrive as +250…, 07…, with spaces or dashes. Accept the lot
// and let a human read it, rather than rejecting a real business over format.
const PHONE = /^[+0-9][0-9\s().-]{6,24}$/;

const schema = z.object({
  placeId: z.string().trim().min(1).optional(),
  businessName: z
    .string()
    .trim()
    .min(2, "Please tell us the name of the business.")
    .max(200),
  plan: z.enum(PLAN_IDS),
  contactName: z.string().trim().min(2, "Please tell us your name.").max(200),
  phone: z
    .string()
    .trim()
    .regex(PHONE, "Please enter a phone number we can call you on."),
  email: z.string().trim().email("Please enter an email address we can reply to."),
  note: z.string().trim().max(2000).optional(),
});

export interface ClaimState {
  error?: string;
  ok?: boolean;
}

export async function submitClaimAction(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const ip = await clientIp();
  const throttled = rateLimit(`claim:${ip}`, CLAIM_PER_IP.limit, CLAIM_PER_IP.windowMs);
  if (!throttled.ok) {
    return {
      error: `Thanks — you've sent several claims already. Please try again in ${formatRetryAfter(throttled.retryAfter)}.`,
    };
  }

  const parsed = schema.safeParse({
    placeId: formData.get("placeId") || undefined,
    businessName: formData.get("businessName"),
    plan: formData.get("plan") ?? "checked",
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Confirm the place exists rather than trusting a posted id. A claim with no
  // matching listing is still worth keeping — we take the lead and find the
  // place by hand — so an unknown id is dropped, not treated as an error.
  let placeId: string | null = null;
  if (parsed.data.placeId) {
    const place = await prisma.place.findUnique({
      where: { id: parsed.data.placeId },
      select: { id: true },
    });
    placeId = place?.id ?? null;
  }

  await prisma.businessClaim.create({
    data: {
      placeId,
      businessName: parsed.data.businessName,
      plan: parsed.data.plan,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      note: parsed.data.note ?? "",
    },
  });

  return { ok: true };
}
