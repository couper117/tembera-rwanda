"use server";

import { AuthError } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, requireBusiness } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getMyBusiness } from "@/lib/data/business";
import { PLACES_TAG } from "@/lib/data/places";
import { clientIp, formatRetryAfter, rateLimit } from "@/lib/rate-limit";
import {
  businessNewPlaceSchema,
  businessPlaceSchema,
  businessProfileSchema,
  businessSignupSchema,
} from "@/lib/validation/business";
import { firstError, fieldErrors, type FieldErrors } from "@/lib/validation/admin";
import { isPaidPlan, planById } from "@/lib/business/plans";
import { newReference } from "@/lib/business/payments";
import { gatewayConfigured, initializeCheckout } from "@/lib/business/rwandapay";
import { siteUrl } from "@/lib/site-url";

export interface BusinessState {
  error?: string;
  fields?: FieldErrors;
  ok?: boolean;
  notice?: string;
  /**
   * A paid sign-up that is waiting for money. The form shows the payment step
   * instead of navigating to a dashboard that does not exist yet.
   */
  awaitingPayment?: {
    reference: string;
    plan: string;
    amountRwf: number;
    /** RwandaPay's hosted checkout. Absent when the gateway is unconfigured or
     *  refused, in which case the screen falls back to paying by hand. */
    paymentUrl?: string;
    /** Why there is no payment link, when there is not one. */
    gatewayError?: string;
  };
  /**
   * What was submitted, echoed back.
   *
   * React resets a form after its action runs. On a rejected submission that
   * wipes everything the person typed — which is worse than the validation
   * error it was reporting, because they have to start again to fix one field.
   * The form re-seeds itself from this.
   */
  values?: Record<string, string>;
}

/** Every text value on the form, so a rejection can hand it straight back. */
function echo(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

const SIGNUP_PER_IP = { limit: 5, windowMs: 60 * 60 * 1000 };

/**
 * Register a business.
 *
 * Two completely different outcomes, decided by the plan:
 *
 * **Free** creates the account, the business and the membership in one
 * transaction, and signs the person in. Nothing is owed, so there is nothing
 * to wait for. Partial success would leave somebody holding a BUSINESS role
 * with no business — able to sign in, and to reach a dashboard with nothing
 * behind it — hence the transaction.
 *
 * **Checked and Top create no account at all.** They write a
 * BusinessRegistration and hand back a payment reference. Until that payment
 * is confirmed there is no User, no Business, no login and no verified tick.
 * This is the fix for the hole the old flow had: it took the plan as a
 * dropdown value and issued a live paid account against it, so anybody willing
 * to select "Top" got the tick and the Recommended slot for nothing.
 *
 * Either way the business starts unverified as a *business identity*; the tick
 * is granted when payment is confirmed, by an admin who has also looked at who
 * they are.
 */
export async function registerBusinessAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const ip = await clientIp();
  const throttled = rateLimit(
    `bizsignup:${ip}`,
    SIGNUP_PER_IP.limit,
    SIGNUP_PER_IP.windowMs,
  );
  if (!throttled.ok) {
    return {
      error: `Too many sign-ups from here. Try again in ${formatRetryAfter(throttled.retryAfter)}.`,
    };
  }

  const parsed = businessSignupSchema.safeParse({
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    password: formData.get("password"),
    plan: formData.get("plan") ?? "free",
  });
  if (!parsed.success) {
    return {
      error: firstError(parsed.error),
      fields: fieldErrors(parsed.error),
      values: echo(formData),
    };
  }
  const d = parsed.data;

  const taken = await prisma.user.findUnique({
    where: { email: d.email },
    select: { id: true },
  });
  if (taken) {
    return {
      error: "An account with that email already exists. Sign in instead.",
      fields: { email: "Already registered." },
      values: echo(formData),
    };
  }

  const passwordHash = await hashPassword(d.password);

  // ---------------------------------------------------------- paid plans --
  if (isPaidPlan(d.plan)) {
    const plan = planById(d.plan)!;

    // One live registration per email. Without this, somebody who reloads the
    // payment step ends up with two references for one intended payment, and
    // whoever reconciles the statement has to guess which is real.
    const existing = await prisma.businessRegistration.findFirst({
      where: { email: d.email, status: "awaiting_payment" },
      select: { reference: true, plan: true, amountRwf: true, paymentUrl: true },
    });
    if (existing) {
      return {
        awaitingPayment: {
          reference: existing.reference,
          plan: existing.plan,
          amountRwf: existing.amountRwf,
          paymentUrl: existing.paymentUrl ?? undefined,
        },
        notice: "You already have a sign-up waiting on payment. Use the same reference.",
      };
    }

    const registration = await prisma.businessRegistration.create({
      data: {
        businessName: d.businessName,
        contactName: d.contactName,
        email: d.email,
        phone: d.phone,
        city: d.city,
        passwordHash,
        plan: d.plan,
        // Frozen at sign-up: a later price change must not alter what this
        // person was quoted while they were walking to an agent.
        amountRwf: plan.rwf,
        reference: newReference(),
      },
    });

    // Open a hosted checkout, if the gateway is configured. A failure here is
    // not a failure of the sign-up: the registration is already saved, so the
    // screen falls back to the mobile-money-by-hand route rather than losing
    // everything the person typed.
    let paymentUrl: string | undefined;
    let gatewayError: string | undefined;

    if (gatewayConfigured()) {
      const base = await siteUrl();
      const opened = await initializeCheckout({
        reference: registration.reference,
        amountRwf: registration.amountRwf,
        customer: { name: d.contactName, phone: d.phone, email: d.email },
        redirectUrl: `${base}/business/register/return?ref=${encodeURIComponent(registration.reference)}`,
        webhookUrl: `${base}/api/webhooks/rwandapay`,
      });

      if (opened.ok) {
        paymentUrl = opened.session.paymentUrl;
        await prisma.businessRegistration.update({
          where: { id: registration.id },
          data: {
            sessionId: opened.session.sessionId,
            paymentUrl: opened.session.paymentUrl,
            sessionExpiresAt: opened.session.expiresAt,
          },
        });
      } else {
        gatewayError = opened.error;
      }
    }

    return {
      awaitingPayment: {
        reference: registration.reference,
        plan: registration.plan,
        amountRwf: registration.amountRwf,
        paymentUrl,
        gatewayError,
      },
    };
  }

  // ---------------------------------------------------------- free plan ---
  const handle = await uniqueHandle(d.businessName);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: d.email,
        name: d.contactName,
        handle,
        passwordHash,
        role: "BUSINESS",
        homeCity: d.city,
      },
    });
    const business = await tx.business.create({
      data: {
        name: d.businessName,
        contactName: d.contactName,
        email: d.email,
        phone: d.phone,
        city: d.city,
        plan: d.plan,
      },
    });
    await tx.businessMember.create({
      data: { businessId: business.id, userId: user.id, owner: true },
    });
  });

  // Sign in, but navigate from the client rather than redirecting here.
  //
  // Setting the session cookie and then calling redirect() in the same action
  // left the browser on the form with the account already created: the cookie
  // was set and the response carried the redirect, but nothing moved, so the
  // person had no way to tell it had worked. Returning `ok` and letting the
  // form push the route is one less piece of framework behaviour to depend on.
  try {
    await signIn("credentials", {
      email: d.email,
      password: d.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "The account was created, but sign-in failed. Try signing in." };
    }
    throw error;
  }

  return { ok: true };
}

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

/* ------------------------------------------------------------- the profile */

export async function updateBusinessProfileAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return { error: "No business is linked to this account." };
  if (!business.owner) {
    return { error: "Only the account owner can change these details." };
  }

  const parsed = businessProfileSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    tin: formData.get("tin"),
  });
  if (!parsed.success) {
    return {
      error: firstError(parsed.error),
      fields: fieldErrors(parsed.error),
      values: echo(formData),
    };
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { ...parsed.data, tin: parsed.data.tin || null },
  });

  await recordAudit({
    actorId: user.id,
    action: "business.profile",
    entity: "business",
    entityId: String(business.id),
  });

  revalidatePath("/business/dashboard/settings");
  return { ok: true };
}

/* ------------------------------------------------------------ the listings */

/** The fields a business is allowed to send, read off the form. */
function readPlaceFields(formData: FormData) {
  return {
    description: formData.get("description"),
    hours: formData.get("hours"),
    hoursJson: formData.get("hoursJson"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    image: formData.get("image"),
    images: formData.get("images"),
    highlights: formData.get("highlights"),
    priceFrom: formData.get("priceFrom"),
    area: formData.get("area"),
    mapLink: formData.get("mapLink"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    coordsPrecision: formData.get("coordsPrecision"),
    keywords: formData.get("keywords"),
    subtype: formData.get("subtype"),
  };
}

/**
 * Edit a listing this business owns.
 *
 * Two independent guards, because neither alone is enough. The whitelist
 * schema means a forged field for `status` or `businessId` has nowhere to
 * land. The ownership check means a forged `placeId` pointing at somebody
 * else's listing is refused outright. A server action is reachable by anyone
 * who can craft a POST, so both matter.
 *
 * A verified business edits live. An unverified one has the same change staged
 * as a submission — same form, different outcome, said plainly.
 */
export async function updateMyPlaceAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return { error: "No business is linked to this account." };

  const placeId = String(formData.get("placeId") ?? "");
  if (!placeId) return { error: "Missing listing." };

  const owned = await prisma.place.findFirst({
    where: { id: placeId, businessId: business.id },
    select: { id: true },
  });
  if (!owned) return { error: "That listing is not yours to edit." };

  const parsed = businessPlaceSchema.safeParse(readPlaceFields(formData));
  if (!parsed.success) {
    return {
      error: firstError(parsed.error),
      fields: fieldErrors(parsed.error),
      values: echo(formData),
    };
  }

  if (business.status !== "verified") {
    await prisma.submission.create({
      data: {
        kind: "edit",
        businessId: business.id,
        submittedByUserId: user.id,
        placeId,
        payload: JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonObject,
      },
    });
    revalidatePath("/business/dashboard");
    return {
      ok: true,
      notice:
        "Sent for review. Your changes go live once Tembera has verified the business.",
    };
  }

  const { hoursJson, ...rest } = parsed.data;
  await prisma.place.update({
    where: { id: placeId },
    data: { ...rest, hoursJson: hoursJson ?? Prisma.DbNull },
  });

  await recordAudit({
    actorId: user.id,
    action: "place.update",
    entity: "place",
    entityId: placeId,
    meta: { by: "business", businessId: business.id },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${placeId}`);
  revalidatePath("/business/dashboard/listings");
  return { ok: true };
}

/** Propose a listing that does not exist yet. Always a submission. */
export async function proposePlaceAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return { error: "No business is linked to this account." };

  const parsed = businessNewPlaceSchema.safeParse({
    ...readPlaceFields(formData),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    subcategory: formData.get("subcategory"),
    city: formData.get("city"),
  });
  if (!parsed.success) {
    return {
      error: firstError(parsed.error),
      fields: fieldErrors(parsed.error),
      values: echo(formData),
    };
  }

  await prisma.submission.create({
    data: {
      kind: "create",
      businessId: business.id,
      submittedByUserId: user.id,
      payload: JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonObject,
    },
  });

  revalidatePath("/business/dashboard");
  return { ok: true, notice: "Sent for review. Tembera will be in touch." };
}

/* --------------------------------------------------------------- the staff */

export async function inviteMemberAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return { error: "No business is linked to this account." };
  if (!business.owner) return { error: "Only the account owner can add colleagues." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Enter their email address." };

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    // There is no email provider yet, so an invitation cannot actually be
    // sent. Saying so beats showing "invitation sent" for a message that will
    // never arrive.
    return {
      error:
        "No account with that address yet. Ask them to register on Tembera first, then add them here.",
    };
  }

  const existing = await prisma.businessMember.findUnique({
    where: { userId: invitee.id },
  });
  if (existing) {
    return {
      error:
        existing.businessId === business.id
          ? "They are already on this account."
          : "That account already belongs to another business.",
    };
  }

  await prisma.$transaction([
    prisma.businessMember.create({
      data: { businessId: business.id, userId: invitee.id },
    }),
    prisma.user.update({ where: { id: invitee.id }, data: { role: "BUSINESS" } }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "business.member.add",
    entity: "business",
    entityId: String(business.id),
    meta: { userId: invitee.id },
  });

  revalidatePath("/business/dashboard/staff");
  return { ok: true };
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business?.owner) return;

  const memberId = Number(formData.get("memberId"));
  if (!Number.isInteger(memberId)) return;

  const member = await prisma.businessMember.findUnique({ where: { id: memberId } });
  // Never the owner, and never somebody from another business.
  if (!member || member.businessId !== business.id || member.owner) return;

  await prisma.$transaction([
    prisma.businessMember.delete({ where: { id: memberId } }),
    prisma.user.update({ where: { id: member.userId }, data: { role: "USER" } }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "business.member.remove",
    entity: "business",
    entityId: String(business.id),
    meta: { userId: member.userId },
  });

  revalidatePath("/business/dashboard/staff");
}

/** Used by the dashboard layout to decide what to show. */
export async function currentBusiness() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getMyBusiness(user.id);
}
