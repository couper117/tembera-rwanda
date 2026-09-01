import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  gatewayConfigured,
  initializeCheckout,
  retryTxRef,
  sessionUsable,
} from "@/lib/business/rwandapay";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Send a payer to a checkout that is actually still open.
 *
 * Checkout sessions last thirty minutes. The sign-up used to mint one when the
 * payment step rendered and then hand out that URL for as long as the row
 * existed — on the page itself, on "Try the payment again", and to anyone who
 * re-submitted the form. Every one of those went stale, and what the payer saw
 * was "This payment link has expired. Please contact the merchant", which
 * reads as a broken integration rather than as a link that timed out.
 *
 * So the session is minted at click time instead of at render time. Every
 * "pay" affordance points here, this checks whether the stored session has
 * enough life left in it, opens a fresh one if not, and redirects. A person
 * who leaves the tab open over lunch and comes back still gets a working
 * checkout.
 *
 * A GET that has a side effect is the deliberate trade: the alternative is a
 * form post, and the thing being protected is a payment page nobody can be
 * charged from without going on to authorise it on the gateway.
 */
export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("ref");
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!reference) return back("/business/register");

  const registration = await prisma.businessRegistration.findUnique({
    where: { reference },
  });
  if (!registration) return back("/business/register");

  // Already paid for, or refused. Either way there is nothing to pay.
  if (registration.status !== "awaiting_payment") {
    return back(`/business/register/return?ref=${encodeURIComponent(reference)}`);
  }

  const base = await siteUrl();

  // Reuse the stored session only if it has life left AND was opened from
  // here. The gateway is told where to send the payer back to at the moment
  // the session is created, so one opened against a different origin returns
  // them to that origin no matter where they are now — which is how somebody
  // ends up staring at ERR_CONNECTION_REFUSED on a port that is no longer
  // listening. Dev ports move around; this has to be checked, not assumed.
  const reusable =
    registration.paymentUrl &&
    sessionUsable(registration.sessionExpiresAt) &&
    registration.sessionOrigin === base;

  if (reusable) {
    return NextResponse.redirect(registration.paymentUrl!);
  }

  if (!gatewayConfigured()) {
    return back(`/business/register/return?ref=${encodeURIComponent(reference)}`);
  }

  const opened = await initializeCheckout({
    reference: registration.reference,
    amountRwf: registration.amountRwf,
    customer: {
      name: registration.contactName,
      phone: registration.phone,
      email: registration.email,
    },
    redirectUrl: `${base}/business/register/return?ref=${encodeURIComponent(reference)}`,
    webhookUrl: `${base}/api/webhooks/rwandapay`,
    // A fresh tx_ref, because the gateway refuses a reused one with a 409 —
    // which is exactly the "payment link has expired" dead end this route
    // exists to get somebody out of. Our own reference is unchanged and still
    // travels in the description, so reconciliation is unaffected.
    txRef: retryTxRef(registration.reference),
  });

  if (!opened.ok) {
    return back(`/business/register/return?ref=${encodeURIComponent(reference)}`);
  }

  await prisma.businessRegistration.update({
    where: { id: registration.id },
    data: {
      sessionId: opened.session.sessionId,
      paymentUrl: opened.session.paymentUrl,
      sessionExpiresAt: opened.session.expiresAt,
      sessionOrigin: base,
      sessionTxRef: opened.session.txRef,
    },
  });

  return NextResponse.redirect(opened.session.paymentUrl);
}
