"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/**
 * Business standing.
 *
 * ADMIN only, not staff: verifying a business is a statement that Tembera has
 * checked who they are, and suspending one takes away their ability to publish.
 * Neither is a catalogue edit.
 */

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["unverified", "verified", "suspended"]),
});

export async function setBusinessStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const updated = await prisma.business
    .update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
      select: { name: true },
    })
    .catch(() => null);
  if (!updated) return;

  await recordAudit({
    actorId: admin.id,
    action: `business.${parsed.data.status}`,
    entity: "business",
    entityId: String(parsed.data.id),
    meta: { name: updated.name },
  });

  revalidatePath("/admin/businesses");
}

/* ------------------------------------------------------- paid sign-ups -- */

const decision = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["confirm", "reject"]),
});

/**
 * Confirm that a paid sign-up's money actually arrived, and issue the account.
 *
 * This is the moment a BusinessRegistration becomes a business. Everything the
 * paid plans sell — editing a live listing, the verified tick, the Recommended
 * slot — exists on the far side of this function, which is the whole point:
 * the old flow granted all of it the instant somebody picked a plan from a
 * dropdown.
 *
 * One transaction, because a half-issued account is the worst of both states.
 * Interactive transactions are exactly why lib/prisma.ts uses the Neon
 * WebSocket driver rather than the HTTP one.
 *
 * ADMIN only. Confirming a payment is a financial assertion and it hands out
 * the tick; an EDITOR fixing opening hours has no business making it.
 *
 * When a payment provider is wired up, its webhook calls this same path with
 * the provider's transaction id — see lib/business/payments.ts.
 */
export async function decideRegistrationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const parsed = decision.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const registration = await prisma.businessRegistration.findUnique({
    where: { id: parsed.data.id },
  });
  // Only a sign-up still waiting can be decided. Re-posting the form after a
  // confirmation must not create a second account for the same person.
  if (!registration || registration.status !== "awaiting_payment") return;

  if (parsed.data.decision === "reject") {
    await prisma.businessRegistration.update({
      where: { id: registration.id },
      data: { status: "rejected", decidedAt: new Date(), decidedById: admin.id },
    });
    await recordAudit({
      actorId: admin.id,
      action: "registration.reject",
      entity: "registration",
      entityId: String(registration.id),
      meta: { business: registration.businessName, reference: registration.reference },
    });
    revalidatePath("/admin/businesses");
    return;
  }

  // The email may have been claimed while the money was in transit.
  const taken = await prisma.user.findUnique({
    where: { email: registration.email },
    select: { id: true },
  });
  if (taken) return;

  const handle = await uniqueRegistrationHandle(registration.businessName);

  await prisma.$transaction(async (tx) => {
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
        // Verified here and only here. Paying is half of it; the other half is
        // that an admin has just looked at this row and decided it is real.
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
        decidedById: admin.id,
        businessId: business.id,
      },
    });
  });

  await recordAudit({
    actorId: admin.id,
    action: "registration.confirm",
    entity: "registration",
    entityId: String(registration.id),
    meta: {
      business: registration.businessName,
      plan: registration.plan,
      reference: registration.reference,
      amountRwf: registration.amountRwf,
    },
  });

  revalidatePath("/admin/businesses");
}

/** Same rule as the free sign-up path, kept here so neither can drift. */
async function uniqueRegistrationHandle(businessName: string): Promise<string> {
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
