"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { activateRegistration } from "@/lib/business/activate";

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
 * The account itself is created by activateRegistration, which the gateway
 * callback and the webhook also call. Confirming by hand and confirming by
 * payment therefore produce exactly the same account, and a manual
 * confirmation racing a late webhook cannot produce two.
 *
 * This path is the fallback: it exists for money that arrives outside the
 * gateway — a direct mobile money transfer against the reference — and for the
 * case where the gateway is unreachable. ADMIN only, because confirming a
 * payment is a financial assertion and it hands out the verified tick; an
 * EDITOR fixing opening hours has no business making it.
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

  // One shared path with the gateway callback and the webhook, so an account
  // created by hand is identical to one created by a confirmed payment — and
  // so a manual confirmation racing a late webhook cannot make two.
  const result = await activateRegistration(registration.reference, "manual", admin.id);
  if (!result.ok) return;

  revalidatePath("/admin/businesses");
}
