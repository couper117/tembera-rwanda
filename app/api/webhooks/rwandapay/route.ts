import { NextResponse } from "next/server";
import { activateRegistration } from "@/lib/business/activate";
import { verifyPayment, verifyWebhookSignature } from "@/lib/business/rwandapay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * RwandaPay tells us a payment landed.
 *
 * Two rules make this endpoint safe to leave open to the internet, which it
 * must be:
 *
 * 1. **The body is never the authority.** A signed body is checked with HMAC;
 *    an unsigned one is not rejected outright but is treated as nothing more
 *    than a hint to go and ask the API. Either way the decision to create an
 *    account comes from `verifyPayment`, a server-to-server call the caller
 *    cannot influence. Without that, anyone who can POST here could mint
 *    themselves a paid, verified account by inventing a reference.
 * 2. **It is idempotent.** Delivery is at-least-once, and it races the payer's
 *    own redirect. `activateRegistration` claims the row conditionally, so a
 *    duplicate is a no-op rather than a second account.
 *
 * It answers 200 to anything it understood, including "not paid". A webhook
 * that returns an error gets retried, and there is nothing to retry when the
 * answer is simply no.
 */
export async function POST(request: Request) {
  const raw = await request.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "unparseable" }, { status: 400 });
  }

  const signature = request.headers.get("x-webhook-signature");
  const signed = verifyWebhookSignature(raw, signature);

  // RwandaPay names the reference differently across event shapes; take the
  // first that looks like one rather than depending on a single field.
  const reference =
    pick(body, "tx_ref") ??
    pick(body, "reference") ??
    pick(body, "paypack_reference") ??
    pick(body.data as Record<string, unknown> | undefined, "tx_ref") ??
    pick(body.data as Record<string, unknown> | undefined, "reference");

  if (!reference) {
    return NextResponse.json({ ok: true, ignored: "no reference" });
  }

  // Ask, do not trust. Even a correctly signed body only earns the right to
  // have us look — the answer still comes from the API.
  const status = await verifyPayment(reference);
  if (!status.paid) {
    return NextResponse.json({ ok: true, reference, paid: false, signed });
  }

  const result = await activateRegistration(
    reference,
    "gateway",
    undefined,
    status.gatewayReference ?? reference,
  );
  return NextResponse.json({
    ok: true,
    reference,
    paid: true,
    signed,
    activated: result.ok,
    ...(result.ok ? {} : { reason: result.reason }),
  });
}

function pick(source: Record<string, unknown> | undefined, key: string): string | null {
  const value = source?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
