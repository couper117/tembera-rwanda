import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { ThemeProvider } from "@/lib/client/theme";
import { prisma } from "@/lib/prisma";
import { activateRegistration } from "@/lib/business/activate";
import { verifyPayment } from "@/lib/business/rwandapay";
import { formatRwf, planById } from "@/lib/business/plans";
import "../../../../admin/admin.css";

export const metadata: Metadata = { title: "Payment" };
export const dynamic = "force-dynamic";

/**
 * Where RwandaPay sends the payer back to.
 *
 * **This page does not trust the redirect.** Landing here proves only that a
 * browser followed a link; it says nothing about money. So it asks the gateway
 * directly, server-side, and only a `verify` that comes back paid creates the
 * account. Anything else says "not yet" — which is also the honest answer when
 * somebody types this URL in by hand.
 *
 * It races the webhook by design, and loses gracefully: activateRegistration
 * claims the row conditionally, so whichever arrives second is told the
 * account already exists rather than making a second one.
 */
export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  const registration = ref
    ? await prisma.businessRegistration.findUnique({ where: { reference: ref } })
    : null;

  if (!registration) return <Shell state="unknown" />;

  if (registration.status === "active") {
    return <Shell state="done" businessName={registration.businessName} />;
  }

  const status = await verifyPayment(registration.reference);

  if (!status.paid) {
    return (
      <Shell
        state="pending"
        businessName={registration.businessName}
        reference={registration.reference}
        amountRwf={registration.amountRwf}
        plan={registration.plan}
        paymentUrl={registration.paymentUrl ?? undefined}
      />
    );
  }

  const result = await activateRegistration(registration.reference, "gateway");
  return result.ok ? (
    <Shell state="done" businessName={registration.businessName} />
  ) : (
    <Shell state="snag" reason={result.reason} reference={registration.reference} />
  );
}

function Shell({
  state,
  businessName,
  reference,
  amountRwf,
  plan,
  paymentUrl,
  reason,
}: {
  state: "done" | "pending" | "unknown" | "snag";
  businessName?: string;
  reference?: string;
  amountRwf?: number;
  plan?: string;
  paymentUrl?: string;
  reason?: string;
}) {
  return (
    <ThemeProvider>
      <div className="b-flow">
        <header className="b-flow__bar">
          <Link href="/" className="b-flow__brand" aria-label="Tembera home">
            <Icon name="pin" size={20} />
            <span>Tembera</span>
            <span className="b-flow__for">for business</span>
          </Link>
        </header>

        <main className="b-flow__main">
          {state === "done" && (
            <section className="b-panel">
              <h1 className="b-panel__title">You are in.</h1>
              <p className="b-panel__lede">
                Payment received{businessName ? ` for ${businessName}` : ""}. Your
                account is live and your listing carries the verified tick. Sign in
                with the email and password you chose.
              </p>
              <div className="b-flow__actions">
                <Link href="/login" className="t-btn t-btn--primary">
                  Sign in
                </Link>
                <Link href="/" className="t-btn t-btn--secondary">
                  Back to Tembera
                </Link>
              </div>
            </section>
          )}

          {state === "pending" && (
            <section className="b-panel">
              <h1 className="b-panel__title">We have not seen the payment yet</h1>
              <p className="b-panel__lede">
                Nothing is lost — your details are saved
                {plan ? ` against the ${planById(plan)?.name ?? plan} plan` : ""}. Mobile
                money can take a minute to settle, so it is worth trying again shortly.
              </p>

              {reference && (
                <div className="b-pay">
                  <p className="b-pay__label">Your reference</p>
                  <div className="b-pay__ref">
                    <code>{reference}</code>
                  </div>
                  {amountRwf !== undefined && (
                    <p className="b-pay__hint">{formatRwf(amountRwf)} outstanding</p>
                  )}
                </div>
              )}

              <p className="b-note">
                <Icon name="shield" size={16} />
                <span>
                  <strong>No account has been created.</strong> One appears the
                  moment the payment is confirmed, and not before.
                </span>
              </p>

              <div className="b-flow__actions">
                {paymentUrl && (
                  <a href={paymentUrl} className="t-btn t-btn--primary">
                    Try the payment again
                  </a>
                )}
                <Link
                  href={`/business/register/return?ref=${encodeURIComponent(reference ?? "")}`}
                  className="t-btn t-btn--secondary"
                >
                  Check again
                </Link>
              </div>
            </section>
          )}

          {state === "unknown" && (
            <section className="b-panel">
              <h1 className="b-panel__title">We do not recognise that reference</h1>
              <p className="b-panel__lede">
                This page is where a payment comes back to. If you were paying for
                a plan, start again and we will give you a fresh reference.
              </p>
              <div className="b-flow__actions">
                <Link href="/business/register" className="t-btn t-btn--primary">
                  Start again
                </Link>
              </div>
            </section>
          )}

          {state === "snag" && (
            <section className="b-panel">
              <h1 className="b-panel__title">Your payment arrived — we need a moment</h1>
              <p className="b-panel__lede">
                {reason === "email-taken"
                  ? "An account already exists with that email address, so we have not created a second one. Nothing has been lost and nobody has been charged twice."
                  : "The payment is confirmed but the account could not be opened automatically."}{" "}
                Send us the reference below and we will finish it by hand today.
              </p>
              {reference && (
                <div className="b-pay">
                  <p className="b-pay__label">Your reference</p>
                  <div className="b-pay__ref">
                    <code>{reference}</code>
                  </div>
                </div>
              )}
              <div className="b-flow__actions">
                <a
                  href={`mailto:business@tembera.rw?subject=Payment%20${reference ?? ""}`}
                  className="t-btn t-btn--primary"
                >
                  <Icon name="mail" size={16} />
                  Email us
                </a>
              </div>
            </section>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
