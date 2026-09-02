"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/**
 * The moment the money lands.
 *
 * This screen exists for one reason: somebody has just paid, and paying is the
 * point in any flow where people are most anxious that it did not work. It has
 * to say "yes, that worked" faster than they can wonder, which is why the tick
 * draws itself rather than simply appearing — motion is what the eye reads as
 * *confirmation* rather than as another piece of layout.
 *
 * Then it gets out of the way. The account exists but nobody is signed into it
 * (the password was chosen before payment and only its hash was kept, so we
 * cannot sign them in for them), so the useful next screen is the sign-in form
 * with their email already filled.
 *
 * Three rules the auto-redirect follows, because a page that moves on its own
 * is hostile if it gets any of them wrong:
 *   - the countdown is visible, so nothing happens unannounced;
 *   - there is a button to go immediately, so nobody has to wait out a timer;
 *   - the destination is a real link, so it still works with no JavaScript and
 *     can be opened in a new tab.
 */

const SECONDS = 5;

export default function PaymentSuccess({
  businessName,
  email,
  testMode,
}: {
  businessName?: string;
  email?: string;
  /** Settled by a test-mode checkout, where no money moved. Say so. */
  testMode?: boolean;
}) {
  const router = useRouter();
  const [left, setLeft] = useState(SECONDS);

  const target = email ? `/login?email=${encodeURIComponent(email)}` : "/login";

  useEffect(() => {
    const tick = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    const go = setTimeout(() => router.push(target), SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [router, target]);

  return (
    <section className="b-panel b-success">
      {/* One live region for the whole outcome. Announcing the tick and the
          countdown separately would talk over itself every second. */}
      <div role="status" aria-live="polite">
        <span className="b-tick" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle className="b-tick__ring" cx="26" cy="26" r="24" />
            <path className="b-tick__mark" d="M15 27.5 L22.5 35 L37.5 19" />
          </svg>
        </span>

        <h1 className="b-panel__title b-success__title">Payment received</h1>
        <p className="b-panel__lede">
          {businessName ? (
            <>
              <strong>{businessName}</strong> is set up. Your account is live and
              your listing carries the verified tick.
            </>
          ) : (
            <>
              Your account is live and your listing carries the verified tick.
            </>
          )}
        </p>
      </div>

      {/* "…to sign in in 5" stutters; the separator reads cleanly and keeps
          the number where the eye is already looking. */}
      {testMode && (
        /* Never let a test-mode account look like a paid one. Somebody will
           find this row in a month and need to know nothing was charged. */
        <p className="b-note b-success__test">
          <Icon name="info" size={16} />
          <span>
            <strong>Test mode.</strong> No money was taken — the payment
            gateway is running on test keys, so this account was opened on a
            simulated payment.
          </span>
        </p>
      )}

      <p className="b-success__next">
        Taking you to sign in {left > 0 ? <>· {left}s</> : <>now…</>}
      </p>

      <div className="b-flow__actions">
        <Link href={target} className="t-btn t-btn--primary">
          Sign in now
        </Link>
        <Link href="/" className="t-btn t-btn--secondary">
          Back to Tembera
        </Link>
      </div>
    </section>
  );
}
