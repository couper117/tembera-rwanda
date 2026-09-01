import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { toLocalPhone } from "./phone";

export { toLocalPhone };

/**
 * RwandaPay, the payment gateway behind paid business plans.
 *
 * Everything here runs on the server. The secret key authorises every charge
 * this application can make, so it is read from `RWANDAPAY_SECRET_KEY` with no
 * `NEXT_PUBLIC_` prefix — a public-prefixed key is compiled into the browser
 * bundle, where anybody can read it.
 *
 * The shape below was confirmed against the live test API rather than taken
 * from the docs alone, because two things differ from a first reading:
 *
 *   1. **`Idempotency-Key` is mandatory** on financial calls. Without it the
 *      API returns 400 IDEMPOTENCY_KEY_REQUIRED before looking at the body.
 *   2. **Phone numbers must be local ten-digit** (`0788123456`). The
 *      international form the sign-up form asks for (`+250 788 123 456`) is
 *      rejected with a 422, so it is normalised on the way out.
 *
 * `verify` answers "has anybody paid this yet", and a reference nobody has
 * paid against comes back as `{"status":"pending","message":"Transaction not
 * found"}` — a 200, not a 404. So a not-found is not an error to report; it is
 * simply "no".
 */

const BASE = process.env.RWANDAPAY_BASE_URL ?? "https://pay.rwandapay.rw/api/v1";

/** Configured only when both keys are present. Half a key pair cannot charge. */
export function gatewayConfigured(): boolean {
  return Boolean(process.env.RWANDAPAY_PUBLIC_KEY && process.env.RWANDAPAY_SECRET_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    "X-Public-Key": process.env.RWANDAPAY_PUBLIC_KEY ?? "",
    "X-Secret-Key": process.env.RWANDAPAY_SECRET_KEY ?? "",
    Accept: "application/json",
  };
}

export interface CheckoutSession {
  /** Our own reference, echoed back. This is what `verify` is keyed on. */
  reference: string;
  sessionId: string;
  paymentUrl: string;
  expiresAt: Date | null;
  /** "test" or "live", straight from the gateway — worth surfacing. */
  mode: string;
}

export type InitializeResult =
  | { ok: true; session: CheckoutSession }
  | { ok: false; error: string };

/**
 * Open a hosted checkout and get the URL to send the payer to.
 *
 * `reference` is ours and must be unique: it doubles as the idempotency key,
 * so a resubmitted sign-up reuses the session it already opened rather than
 * charging somebody twice.
 */
export async function initializeCheckout(input: {
  reference: string;
  amountRwf: number;
  customer: { name: string; phone: string; email: string };
  redirectUrl?: string;
  webhookUrl?: string;
}): Promise<InitializeResult> {
  if (!gatewayConfigured()) return { ok: false, error: "Payments are not configured." };

  const phone = toLocalPhone(input.customer.phone);
  if (!phone) {
    return {
      ok: false,
      error: "That phone number is not a Rwandan mobile number we can charge.",
    };
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}/checkout/initialize`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        "Idempotency-Key": input.reference,
      },
      body: JSON.stringify({
        amount: input.amountRwf,
        tx_ref: input.reference,
        // `tx_ref` identifies the checkout SESSION and does not survive onto
        // the transaction — a paid transaction carries RwandaPay's own
        // `PAY-...` reference and no field pointing back at ours. `description`
        // and `metadata` do survive, so the reference travels in both. See
        // verifyPayment, which reconciles on them.
        description: `Tembera ${input.reference}`,
        metadata: { tembera_reference: input.reference },
        customer: { name: input.customer.name, phone, email: input.customer.email },
        ...(input.redirectUrl ? { redirect_url: input.redirectUrl } : {}),
        ...(input.webhookUrl ? { webhook_url: input.webhookUrl } : {}),
      }),
      cache: "no-store",
    });
  } catch {
    // The network, not the payer. Say so, because "try again" is good advice
    // here and terrible advice for a declined card.
    return { ok: false, error: "We could not reach the payment service. Try again." };
  }

  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; message?: string; data?: Record<string, unknown> }
    | null;

  if (!res.ok || !body?.success || !body.data) {
    return { ok: false, error: body?.message ?? "The payment service refused that request." };
  }

  const data = body.data;
  const paymentUrl = typeof data.payment_url === "string" ? data.payment_url : null;
  const sessionId = typeof data.session_id === "string" ? data.session_id : null;
  if (!paymentUrl || !sessionId) {
    return { ok: false, error: "The payment service returned an unusable session." };
  }

  return {
    ok: true,
    session: {
      reference: typeof data.reference === "string" ? data.reference : input.reference,
      sessionId,
      paymentUrl,
      expiresAt:
        typeof data.expires_at === "string" ? new Date(data.expires_at) : null,
      mode: typeof data.mode === "string" ? data.mode : "unknown",
    },
  };
}

export interface PaymentStatus {
  /** True only when the gateway says the money is in. Nothing else grants it. */
  paid: boolean;
  /** The gateway's own word: pending / successful / failed. */
  status: string;
  /** Present when the call itself failed, as opposed to the payment. */
  error?: string;
  /** RwandaPay's own reference for the transaction, once one exists. */
  gatewayReference?: string;
}

/**
 * Has this reference been paid?
 *
 * Harder than it should be, and worth explaining, because the obvious
 * implementation is wrong in a way that fails silently.
 *
 * `/checkout/{x}/verify` answers correctly — but only for **RwandaPay's own**
 * transaction reference (`PAY-TEST-…`). Given the `tx_ref` we chose, it
 * returns a 200 saying `{"status":"pending","message":"Transaction not
 * found"}` forever, even after the money has arrived. Initialize echoes our
 * `tx_ref` back as `data.reference`, which makes it look like the identifier
 * to verify on; it is the checkout session's, not the transaction's, and a
 * paid transaction carries no field pointing back at it.
 *
 * So there are two paths, tried in order:
 *
 *   1. **Direct.** Works when we are handed RwandaPay's reference — which is
 *      what their webhook sends. Cheap, and exact.
 *   2. **Reconcile.** Scan recent transactions for a successful one whose
 *      `description` or `metadata` carries our reference. That is why
 *      initializeCheckout puts it in both.
 *
 * Conservative throughout: a network failure, a malformed body and an unpaid
 * reference all come back `paid: false`, because the only thing this answer
 * decides is whether to issue a paid account, and the safe default is not to.
 */
export async function verifyPayment(reference: string): Promise<PaymentStatus> {
  if (!gatewayConfigured()) return { paid: false, status: "unconfigured" };

  const direct = await verifyDirect(reference);
  if (direct.paid) return direct;

  const found = await findTransaction(reference);
  if (found) {
    return { paid: true, status: found.status, gatewayReference: found.reference };
  }

  return direct;
}

/** `/checkout/{reference}/verify`, keyed on RwandaPay's own reference. */
async function verifyDirect(reference: string): Promise<PaymentStatus> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/checkout/${encodeURIComponent(reference)}/verify`, {
      headers: authHeaders(),
      cache: "no-store",
    });
  } catch {
    return { paid: false, status: "unreachable", error: "Could not reach the payment service." };
  }

  const body = (await res.json().catch(() => null)) as
    | { status?: string; completed?: boolean; success?: boolean; message?: string }
    | null;

  if (!body) return { paid: false, status: "unreadable" };

  // Both flags, not either. `success` alone appears on a body that also says
  // the transaction does not exist.
  const paid = body.success === true && body.completed === true;
  return { paid, status: body.status ?? "unknown" };
}

interface GatewayTransaction {
  reference: string;
  status: string;
}

/**
 * Find a successful transaction carrying our reference.
 *
 * Matches on the two fields that survive from the checkout onto the
 * transaction. Requires an explicitly successful status: `settled`, `pending`
 * and `failed` rows all appear in this list, and only one of them means the
 * money is in.
 */
async function findTransaction(reference: string): Promise<GatewayTransaction | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/transactions?per_page=50`, {
      headers: authHeaders(),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  const body = (await res.json().catch(() => null)) as
    | { data?: { data?: unknown[] } | unknown[] }
    | null;
  const rows = Array.isArray(body?.data)
    ? body.data
    : Array.isArray((body?.data as { data?: unknown[] } | undefined)?.data)
      ? (body!.data as { data: unknown[] }).data
      : [];

  for (const row of rows as Record<string, unknown>[]) {
    const status = typeof row.status === "string" ? row.status : "";
    if (status !== "successful" && status !== "completed") continue;

    const description = typeof row.description === "string" ? row.description : "";
    const meta = row.metadata as Record<string, unknown> | null | undefined;
    const tagged =
      typeof meta?.tembera_reference === "string" ? meta.tembera_reference : "";

    if (description.includes(reference) || tagged === reference) {
      const ref = typeof row.reference === "string" ? row.reference : reference;
      return { reference: ref, status };
    }
  }
  return null;
}

/**
 * Is this webhook really from RwandaPay?
 *
 * An unverified webhook endpoint is an open door that grants paid accounts to
 * anyone who can POST to it, so this is not optional: with no configured
 * secret the answer is no, and the endpoint falls back to asking the API
 * directly rather than trusting the body.
 *
 * timingSafeEqual, because comparing signatures with `===` leaks how much of a
 * guess was right through how long the comparison took.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RWANDAPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = signature.replace(/^sha256=/, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** A fresh idempotency key, for calls that are not keyed on our reference. */
export function idempotencyKey(): string {
  return randomUUID();
}
