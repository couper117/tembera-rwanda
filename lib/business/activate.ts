import "server-only";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

/**
 * Turn a paid sign-up into an account. The only function that does.
 *
 * Four different things can decide a payment has landed — the payer coming
 * back from the gateway, RwandaPay's webhook, an admin matching a mobile money
 * statement by hand, and a completed test-mode checkout — and all of them call
 * this. One path means the three
 * cannot drift apart on what a paid account looks like, and it means the rule
 * that a Business is created `verified` lives in exactly one place.
 *
 * **Idempotent, and it has to be.** The redirect back and the webhook race
 * each other constantly: the payer's browser and RwandaPay's server both
 * report the same payment within a second or two of each other. The guard is
 * the conditional `updateMany` below — it claims the row only if it is still
 * `awaiting_payment`, and Postgres decides the winner. A `findUnique` followed
 * by an `update` would let both callers pass the check and create two accounts
 * for one payment.
 */

export type ActivationResult =
  | { ok: true; businessId: number; alreadyActive?: boolean }
  | { ok: false; reason: "not-found" | "not-waiting" | "email-taken" };

export async function activateRegistration(
  reference: string,
  via: "gateway" | "manual" | "test-mode",
  actorId?: number,
  /**
   * RwandaPay's own reference for the transaction that paid for this, when we
   * have it. Recorded in the audit trail so an account can be tied back to the
   * payment that bought it — which is the first thing anybody asks in a
   * dispute, and it is not derivable afterwards: a transaction carries no
   * field pointing back at our reference.
   */
  gatewayReference?: string,
): Promise<ActivationResult> {
  const registration = await prisma.businessRegistration.findUnique({
    where: { reference },
  });
  if (!registration) return { ok: false, reason: "not-found" };

  // Already done — almost always the other caller in the race, so this is a
  // normal outcome and not something to report as a failure.
  if (registration.status === "active" && registration.businessId) {
    return { ok: true, businessId: registration.businessId, alreadyActive: true };
  }
  if (registration.status !== "awaiting_payment") return { ok: false, reason: "not-waiting" };

  // Claim the row. Exactly one caller gets a count of 1.
  const claimed = await prisma.businessRegistration.updateMany({
    where: { id: registration.id, status: "awaiting_payment" },
    data: { status: "paid" },
  });
  if (claimed.count === 0) {
    const now = await prisma.businessRegistration.findUnique({
      where: { id: registration.id },
      select: { status: true, businessId: true },
    });
    return now?.status === "active" && now.businessId
      ? { ok: true, businessId: now.businessId, alreadyActive: true }
      : { ok: false, reason: "not-waiting" };
  }

  // The email may have been claimed while the money was in transit. Put the
  // row back so it shows up in the admin queue rather than vanishing.
  const taken = await prisma.user.findUnique({
    where: { email: registration.email },
    select: { id: true },
  });
  if (taken) {
    await prisma.businessRegistration.update({
      where: { id: registration.id },
      data: { status: "awaiting_payment" },
    });
    return { ok: false, reason: "email-taken" };
  }

  const handle = await uniqueHandle(registration.businessName);

  const businessId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: registration.email,
        name: registration.contactName,
        handle,
        // Reused, never regenerated: they chose this password before paying
        // and expect to sign in with it.
        passwordHash: registration.passwordHash,
        role: "BUSINESS",
        homeCity: registration.city,
      },
    });

    const business = await tx.business.create({
      data: {
        name: registration.businessName,
        contactName: registration.contactName,
        email: registration.email,
        phone: registration.phone,
        city: registration.city,
        plan: registration.plan,
        // Verified here and only here. This is the single moment the verified
        // tick becomes possible for anything this business owns.
        status: "verified",
      },
    });

    await tx.businessMember.create({
      data: { businessId: business.id, userId: user.id, owner: true },
    });

    await tx.businessRegistration.update({
      where: { id: registration.id },
      data: {
        status: "active",
        decidedAt: new Date(),
        decidedById: actorId ?? null,
        businessId: business.id,
        confirmedVia: via,
      },
    });

    return business.id;
  });

  await recordAudit({
    actorId: actorId ?? null,
    action: "registration.confirm",
    entity: "registration",
    entityId: String(registration.id),
    meta: {
      business: registration.businessName,
      plan: registration.plan,
      reference: registration.reference,
      amountRwf: registration.amountRwf,
      via,
      ...(gatewayReference ? { gatewayReference } : {}),
    },
  });

  return { ok: true, businessId };
}

/** Same rule as the free sign-up path, so neither can drift from the other. */
async function uniqueHandle(businessName: string): Promise<string> {
  const base =
    businessName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "business";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}${n}`;
    const taken = await prisma.user.findUnique({
      where: { handle: candidate },
      select: { handle: true },
    });
    if (!taken) return candidate;
  }
}
