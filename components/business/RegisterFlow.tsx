"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { Field } from "@/components/admin/Field";
import FormFeedback from "@/components/admin/FormFeedback";
import {
  PLANS,
  formatRwf,
  formatUsd,
  isPaidPlan,
  planById,
  type PlanId,
} from "@/lib/business/plans";
import { registerBusinessAction, type BusinessState } from "@/lib/actions/business";
import type { PayTo } from "@/lib/business/payments";

/**
 * Signing a business up, as four screens instead of one.
 *
 * The old page put the pitch, the prices and a nine-field form on one scroll,
 * which asked somebody to decide what they were buying and hand over their
 * details in the same breath. Splitting it means each screen asks one thing,
 * and the person can see how far through they are.
 *
 * The steps are deliberately not routes. A half-filled sign-up is not a place
 * you should be able to link somebody to, or land on from a search result, and
 * keeping it in one component means the plan chosen in step 2 is simply state
 * by the time step 3 submits — no draft rows, no query strings carrying a
 * price around.
 *
 * Step 4 only exists for the paid plans, and it is not decorative: on Checked
 * and Top the account does not exist yet when it renders. See
 * registerBusinessAction.
 */

const initial: BusinessState = {};

type Step = 0 | 1 | 2 | 3;

const STEPS: { title: string; short: string }[] = [
  { title: "What you get", short: "Benefits" },
  { title: "Choose a plan", short: "Plan" },
  { title: "Your details", short: "Details" },
  { title: "Payment", short: "Payment" },
];

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "A listing visitors can trust",
    body: "We confirm your details with you, then mark the listing as checked so visitors know it is current — not something scraped two years ago.",
  },
  {
    icon: "clock",
    title: "Your own hours and photos",
    body: "Change your opening hours, phone number and pictures yourself, whenever they change. No email, no waiting for us.",
  },
  {
    icon: "star",
    title: "Reply to what people say",
    body: "Answer reviews in your own words, under your own name, where the person who wrote them will see it.",
  },
  {
    icon: "navigate",
    title: "Get found by people already looking",
    body: "Tembera is where visitors search for places in Rwanda. On the Top plan you also surface in Recommended, marked as sponsored.",
  },
];

export default function RegisterFlow({
  cities,
  payTo,
}: {
  cities: string[];
  /** Where the money goes, from the environment. Null when unconfigured. */
  payTo: PayTo | null;
}) {
  const [step, setStep] = useState<Step>(0);
  const [plan, setPlan] = useState<PlanId>("checked");
  const [state, formAction, pending] = useActionState(registerBusinessAction, initial);
  const router = useRouter();

  // A free sign-up is signed in by the action and lands on its dashboard. A
  // paid one has no account to land in, so it moves to the payment step.
  useEffect(() => {
    if (state.ok) router.push("/business/dashboard");
    if (state.awaitingPayment) setStep(3);
  }, [state.ok, state.awaitingPayment, router]);

  // The last step is payment, which the free plan never reaches.
  const lastStep: Step = isPaidPlan(plan) ? 3 : 2;
  const chosen = planById(plan)!;

  return (
    <div className="b-flow">
      <header className="b-flow__bar">
        <Link href="/" className="b-flow__brand" aria-label="Tembera home">
          <Icon name="pin" size={20} />
          <span>Tembera</span>
          <span className="b-flow__for">for business</span>
        </Link>
        <Link href="/login" className="t-btn t-btn--ghost t-btn--sm b-flow__signin">
          {/* Two labels rather than one that wraps to two lines at 390px. */}
          <span className="b-flow__signin--long">I already have an account</span>
          <span className="b-flow__signin--short">Sign in</span>
        </Link>
      </header>

      {/* Where you are, and how much is left. On a phone it collapses to the
          count, because five words per step will not fit and a truncated
          progress indicator is worse than an honest counter. */}
      <nav className="b-steps" aria-label="Progress">
        <ol className="b-steps__list">
          {STEPS.slice(0, lastStep + 1).map((s, i) => (
            <li
              key={s.title}
              className={[
                "b-step",
                i === step ? "b-step--now" : "",
                i < step ? "b-step--done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="b-step__dot">
                {i < step ? <Icon name="check" size={13} /> : i + 1}
              </span>
              <span className="b-step__label">{s.short}</span>
            </li>
          ))}
        </ol>
        <p className="b-steps__count">
          Step {step + 1} of {lastStep + 1}
        </p>
      </nav>

      <main className="b-flow__main">
        {/* ------------------------------------------------- 1. benefits -- */}
        {step === 0 && (
          <section className="b-panel">
            <h1 className="b-panel__title">
              Are you a hotel, restaurant, shop or tour guide?
            </h1>
            <p className="b-panel__lede">
              Your place is probably already on Tembera. This is how you take
              charge of what it says.
            </p>

            <ul className="b-benefits">
              {BENEFITS.map((b) => (
                <li key={b.title} className="b-benefit">
                  <span className="b-benefit__icon">
                    <Icon name={b.icon} size={20} />
                  </span>
                  <span>
                    <strong className="b-benefit__title">{b.title}</strong>
                    <span className="b-benefit__body">{b.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="b-flow__actions">
              <button
                type="button"
                className="t-btn t-btn--primary"
                onClick={() => setStep(1)}
              >
                See the plans
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------- 2. plans -- */}
        {step === 1 && (
          <section className="b-panel">
            <h1 className="b-panel__title">Choose a plan</h1>
            <p className="b-panel__lede">
              Paid monthly, in Rwandan francs. Cancel whenever you like.
            </p>

            <div className="b-plans" role="radiogroup" aria-label="Plans">
              {PLANS.map((p) => {
                const selected = p.id === plan;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`b-plan${selected ? " b-plan--on" : ""}`}
                    onClick={() => setPlan(p.id)}
                  >
                    <span className="b-plan__head">
                      <span className="b-plan__name">{p.name}</span>
                      {p.featured && (
                        <span className="t-badge t-badge--accent">Most chosen</span>
                      )}
                    </span>

                    <span className="b-plan__price">{formatRwf(p.rwf)}</span>
                    <span className="b-plan__per">
                      {p.rwf === 0 ? "no charge" : `a month · ${formatUsd(p.usd)}`}
                    </span>

                    {/* The tick is the thing people are actually buying, so it
                        is called out rather than being one bullet among five. */}
                    {p.verifiedTick && (
                      <span className="b-plan__tick">
                        <Icon name="shield" size={15} />
                        Includes the verified tick
                      </span>
                    )}

                    <span className="b-plan__tagline">{p.tagline}</span>

                    <ul className="b-plan__perks">
                      {p.perks.map((perk) => (
                        <li key={perk}>
                          <Icon name="check" size={14} />
                          {perk}
                        </li>
                      ))}
                    </ul>

                    <span className="b-plan__pick" aria-hidden="true">
                      {selected ? "Selected" : "Choose"}
                    </span>
                  </button>
                );
              })}
            </div>

            {isPaidPlan(plan) && (
              <p className="b-note">
                <Icon name="info" size={16} />
                <span>
                  Your account is created once your first payment reaches us —
                  not before. You will get a reference to pay against on the
                  next screen but one.
                </span>
              </p>
            )}

            <div className="b-flow__actions">
              <button
                type="button"
                className="t-btn t-btn--secondary"
                onClick={() => setStep(0)}
              >
                Back
              </button>
              <button
                type="button"
                className="t-btn t-btn--primary"
                onClick={() => setStep(2)}
              >
                Continue with {chosen.name}
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </section>
        )}

        {/* -------------------------------------------------- 3. details -- */}
        {step === 2 && (
          <section className="b-panel">
            <h1 className="b-panel__title">Your details</h1>
            <p className="b-panel__lede">
              {isPaidPlan(plan)
                ? `${chosen.name} — ${formatRwf(chosen.rwf)} a month. Nothing is charged yet.`
                : "Free — nothing to pay, now or later."}
            </p>

            <form action={formAction} className="a-form a-form--roomy">
              <FormFeedback
                fields={state.fields}
                error={state.error}
                labels={{
                  businessName: "Business name",
                  contactName: "Your name",
                  email: "Email",
                  phone: "Phone",
                  city: "District",
                  password: "Password",
                }}
              />

              {/* The plan was chosen on the previous screen; it travels with
                  the form rather than being a dropdown the person meets twice
                  and can disagree with themselves about. */}
              <input type="hidden" name="plan" value={plan} />

              <Field
                name="businessName"
                label="Business name"
                required
                error={state.fields?.businessName}
                hint="As visitors would recognise it on a sign."
              >
                <input
                  id="businessName"
                  name="businessName"
                  className="a-input"
                  defaultValue={state.values?.businessName}
                  required
                />
              </Field>

              <div className="a-grid2">
                <Field
                  name="contactName"
                  label="Your name"
                  required
                  error={state.fields?.contactName}
                >
                  <input
                    id="contactName"
                    name="contactName"
                    className="a-input"
                    defaultValue={state.values?.contactName}
                    required
                  />
                </Field>
                <Field name="phone" label="Phone" required error={state.fields?.phone}>
                  <input
                    id="phone"
                    name="phone"
                    className="a-input"
                    placeholder="+250 788 123 456"
                    defaultValue={state.values?.phone}
                    required
                  />
                </Field>
              </div>

              <div className="a-grid2">
                <Field name="email" label="Email" required error={state.fields?.email}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="a-input"
                    defaultValue={state.values?.email}
                    required
                  />
                </Field>
                <Field name="city" label="District" required error={state.fields?.city}>
                  <input
                    id="city"
                    name="city"
                    className="a-input"
                    list="signup-cities"
                    defaultValue={state.values?.city}
                    required
                  />
                  <datalist id="signup-cities">
                    {cities.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              </div>

              <Field
                name="password"
                label="Password"
                required
                error={state.fields?.password}
                hint="At least 8 characters. This is how you will sign in."
              >
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="a-input"
                  minLength={8}
                  required
                />
              </Field>

              <div className="b-flow__actions">
                <button
                  type="button"
                  className="t-btn t-btn--secondary"
                  onClick={() => setStep(1)}
                  disabled={pending}
                >
                  Back
                </button>
                <button type="submit" className="t-btn t-btn--primary" disabled={pending}>
                  {pending
                    ? "Just a moment…"
                    : isPaidPlan(plan)
                      ? "Continue to payment"
                      : "Create my free account"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* -------------------------------------------------- 4. payment -- */}
        {step === 3 && state.awaitingPayment && (
          <PaymentStep
            reference={state.awaitingPayment.reference}
            amountRwf={state.awaitingPayment.amountRwf}
            planName={planById(state.awaitingPayment.plan)?.name ?? state.awaitingPayment.plan}
            notice={state.notice}
            payTo={payTo}
            paymentUrl={state.awaitingPayment.paymentUrl}
            gatewayError={state.awaitingPayment.gatewayError}
          />
        )}
      </main>
    </div>
  );
}

/**
 * What to pay, where, and what happens next.
 *
 * This screen is the honest half of the fix. It does not pretend a card was
 * charged: it tells somebody exactly what to send, what reference to quote,
 * and that their account appears when the money is matched. Vague reassurance
 * here would cost more trust than the wait does.
 */
function PaymentStep({
  reference,
  amountRwf,
  planName,
  notice,
  payTo,
  paymentUrl,
  gatewayError,
}: {
  reference: string;
  amountRwf: number;
  planName: string;
  notice?: string;
  payTo: PayTo | null;
  /** RwandaPay's hosted checkout, when one was opened. */
  paymentUrl?: string;
  /** Why there is not one, when there is not. */
  gatewayError?: string;
}) {
  const [copied, setCopied] = useState(false);

  // With a hosted checkout open, paying is one button and the account appears
  // by itself. Without one, it falls back to mobile money by hand — the
  // registration is already saved either way, so a gateway that is down costs
  // the person a slower route, not their details.
  if (paymentUrl) {
    return (
      <section className="b-panel">
        <h1 className="b-panel__title">Pay {formatRwf(amountRwf)} to finish</h1>
        <p className="b-panel__lede">
          {planName}, paid monthly. Your details are saved — the account opens
          the moment the payment clears, and not a moment before.
        </p>

        {notice && (
          <p className="b-note">
            <Icon name="info" size={16} />
            <span>{notice}</span>
          </p>
        )}

        <div className="b-flow__actions">
          {/* Through /pay rather than straight at the gateway: a checkout
              session lasts thirty minutes, and this page can sit open for
              longer than that. The route mints a fresh one at click time. */}
          <a
            href={`/business/register/pay?ref=${encodeURIComponent(reference)}`}
            className="t-btn t-btn--primary"
          >
            <Icon name="shield" size={17} />
            Pay {formatRwf(amountRwf)} securely
          </a>
        </div>

        <p className="b-note">
          <Icon name="shield" size={16} />
          <span>
            You pay on RwandaPay, not here — Tembera never sees your mobile
            money PIN or your card. Your reference is{" "}
            <strong>{reference}</strong>; keep it if you need to ask us about
            this payment.
          </span>
        </p>

        <div className="b-flow__actions">
          <Link href="/" className="t-btn t-btn--secondary">
            I will pay later
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="b-panel">
      <h1 className="b-panel__title">Almost there — send the payment</h1>
      <p className="b-panel__lede">
        Your details are saved. {planName} costs {formatRwf(amountRwf)} a month,
        and your account opens as soon as we match your payment.
      </p>

      {gatewayError && (
        <p className="b-note">
          <Icon name="info" size={16} />
          <span>
            Card and mobile money checkout is unavailable right now
            ({gatewayError}), so here is how to pay us directly.
          </span>
        </p>
      )}

      {notice && (
        <p className="b-note">
          <Icon name="info" size={16} />
          <span>{notice}</span>
        </p>
      )}

      <div className="b-pay">
        <p className="b-pay__label">Quote this reference when you pay</p>
        <div className="b-pay__ref">
          <code>{reference}</code>
          <button
            type="button"
            className="t-btn t-btn--secondary t-btn--sm"
            onClick={() => {
              void navigator.clipboard
                .writeText(reference)
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="b-pay__hint">
          Write it down before you leave this page. Without it we cannot match
          your payment to your sign-up.
        </p>
      </div>

      <ol className="b-pay__steps">
        {payTo ? (
          <li>
            Send {formatRwf(amountRwf)} by mobile money to{" "}
            <strong>{payTo.number}</strong> — the name shown should be{" "}
            <strong>{payTo.name}</strong>. If it is not, stop and tell us.
          </li>
        ) : (
          /* Better to say the number is not published than to invent one:
             somebody sending money to a wrong number is unrecoverable. */
          <li>
            Send {formatRwf(amountRwf)} by mobile money. We will email you the
            number to pay — we do not publish it here until it is confirmed.
          </li>
        )}
        <li>Put the reference above in the payment message.</li>
        <li>
          We check payments each working day. When yours is matched, your
          account is created and your listing gets its verified tick.
        </li>
      </ol>

      <p className="b-note">
        <Icon name="shield" size={16} />
        <span>
          <strong>No account exists yet.</strong> Nothing has been charged
          automatically, and nobody can sign in with these details until the
          payment is confirmed. That is deliberate.
        </span>
      </p>

      <div className="b-flow__actions">
        <Link href="/" className="t-btn t-btn--secondary">
          Back to Tembera
        </Link>
        <a href={`mailto:business@tembera.rw?subject=Payment%20${reference}`} className="t-btn t-btn--primary">
          <Icon name="mail" size={16} />
          Email us about this payment
        </a>
      </div>
    </section>
  );
}
