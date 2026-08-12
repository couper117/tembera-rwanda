"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon, { type IconName } from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import { createBooking, type BookingResult } from "./actions";

/**
 * Trip booking. The server action, its validation and the server-side pricing
 * are unchanged — this is a UI rebuild onto the app's design system, replacing
 * the old two-column marketing layout with a form that works thumb-first.
 */
const EXPERIENCES: { value: string; price: number; icon: IconName; blurb: string }[] = [
  {
    value: "Gorilla Trekking",
    price: 1500,
    icon: "tree",
    blurb: "Volcanoes National Park · full day",
  },
  {
    value: "Akagera Safari",
    price: 150,
    icon: "compass",
    blurb: "Akagera National Park · game drive",
  },
  {
    value: "Nyungwe Canopy",
    price: 60,
    icon: "ticket",
    blurb: "Nyungwe Forest · canopy walkway",
  },
];

export default function BookingPage() {
  const [experience, setExperience] = useState(EXPERIENCES[0].value);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, startTransition] = useTransition();

  const pricePer = useMemo(
    () => EXPERIENCES.find((e) => e.value === experience)?.price ?? 0,
    [experience],
  );
  const total = pricePer * guests;

  // Can't book a trip in the past.
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    data.set("experience", experience);
    data.set("date", date);
    data.set("guests", String(guests));
    data.set("fullName", fullName);
    data.set("email", email);
    startTransition(async () => setResult(await createBooking(data)));
  }

  if (result?.ok) {
    return (
      <>
        <PageHeader title="Booking confirmed" fallbackHref="/" />
        <main className="t-main">
          <div className="t-page" style={{ maxWidth: 560 }}>
            <div className="t-state">
              <span
                className="t-state__icon"
                style={{ background: "var(--t-accent-soft)", color: "var(--t-accent)" }}
              >
                <Icon name="check" size={26} />
              </span>
              <h1 className="t-title">Booking #{result.id} confirmed</h1>
              <p className="t-state__text">
                {experience} for {guests} {guests === 1 ? "guest" : "guests"} on{" "}
                {date}. Total ${result.total.toLocaleString()}. We&apos;ll email{" "}
                {email} with the details.
              </p>
              <div className="t-state__actions">
                <Link href="/" className="t-btn t-btn--primary t-btn--sm">
                  Back to Tembera
                </Link>
                <button
                  type="button"
                  className="t-btn t-btn--secondary t-btn--sm"
                  onClick={() => setResult(null)}
                >
                  Book another
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Plan a trip" fallbackHref="/" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 620 }}>
          <div className="t-section">
            <h1 className="t-display">Plan a trip</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              Request one of three guided experiences. No payment is taken here.
            </p>
          </div>

          <form onSubmit={onSubmit} className="t-stack-6" style={{ marginTop: "var(--t-6)" }}>
            {/* ------------------------------------------ experience -- */}
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="t-label" style={{ marginBottom: "var(--t-2)" }}>
                Experience
              </legend>
              <div className="t-stack-2">
                {EXPERIENCES.map((item) => {
                  const active = experience === item.value;
                  return (
                    <label
                      key={item.value}
                      className="t-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--t-3)",
                        padding: "var(--t-3) var(--t-4)",
                        cursor: "pointer",
                        borderColor: active ? "var(--t-accent)" : undefined,
                        boxShadow: active ? "0 0 0 3px var(--t-accent-soft)" : undefined,
                      }}
                    >
                      <input
                        type="radio"
                        name="experience"
                        value={item.value}
                        checked={active}
                        onChange={() => setExperience(item.value)}
                        className="t-sr"
                      />
                      <span
                        className="t-fact__icon"
                        style={
                          active
                            ? { background: "var(--t-accent-soft)", color: "var(--t-accent)" }
                            : undefined
                        }
                      >
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="t-row__name" style={{ display: "block" }}>
                          {item.value}
                        </span>
                        <span className="t-small t-muted">{item.blurb}</span>
                      </span>
                      <span style={{ fontWeight: 700 }}>${item.price.toLocaleString()}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* ------------------------------------------ date/guests -- */}
            <div className="t-stack-4">
              <label className="t-stack">
                <span className="t-label" style={{ marginBottom: "var(--t-2)" }}>
                  Preferred date
                </span>
                <input
                  type="date"
                  className="t-select"
                  style={{ height: 52 }}
                  value={date}
                  min={today}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>

              <div>
                <span className="t-label" style={{ display: "block", marginBottom: "var(--t-2)" }}>
                  Guests
                </span>
                <div className="t-inline">
                  <button
                    type="button"
                    className="t-iconbtn"
                    style={{ border: "1px solid var(--t-border)" }}
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    aria-label="One fewer guest"
                    disabled={guests <= 1}
                  >
                    <Icon name="minus" size={18} />
                  </button>
                  <span
                    style={{ minWidth: 40, textAlign: "center", fontWeight: 700 }}
                    aria-live="polite"
                  >
                    {guests}
                  </span>
                  <button
                    type="button"
                    className="t-iconbtn"
                    style={{ border: "1px solid var(--t-border)" }}
                    onClick={() => setGuests((g) => Math.min(20, g + 1))}
                    aria-label="One more guest"
                    disabled={guests >= 20}
                  >
                    <Icon name="plus" size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* --------------------------------------------- contact -- */}
            <div className="t-stack-3">
              <span className="t-label">Your details</span>
              <label className="t-field">
                <span className="t-sr">Full name</span>
                <Icon name="user" size={18} />
                <input
                  className="t-field__input"
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label className="t-field">
                <span className="t-sr">Email address</span>
                <Icon name="external" size={18} />
                <input
                  className="t-field__input"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
            </div>

            {/* ----------------------------------------------- total -- */}
            <div className="t-card" style={{ padding: "var(--t-4)" }}>
              <div className="t-inline">
                <span className="t-small t-muted">
                  ${pricePer.toLocaleString()} × {guests}{" "}
                  {guests === 1 ? "guest" : "guests"}
                </span>
                <span className="t-spacer" />
                <span className="t-title">${total.toLocaleString()}</span>
              </div>
            </div>

            {result && !result.ok && (
              <div className="t-notice t-notice--danger" role="alert">
                <span className="t-notice__icon">
                  <Icon name="alert" size={18} />
                </span>
                <div className="t-notice__body">
                  <div className="t-notice__title">We couldn&apos;t submit that</div>
                  {result.error}
                </div>
              </div>
            )}

            <button type="submit" className="t-btn t-btn--primary t-btn--block" disabled={pending}>
              {pending ? (
                <>
                  <Spinner size={18} tone="current" label="Submitting your booking" />
                  Submitting…
                </>
              ) : (
                `Request booking · $${total.toLocaleString()}`
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
