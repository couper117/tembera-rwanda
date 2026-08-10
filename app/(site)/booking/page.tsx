"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking, type BookingResult } from "./actions";

const EXPERIENCES = [
  { value: "Gorilla Trekking", price: 1500, icon: "fas fa-gorilla", label: "Gorilla Trekking" },
  { value: "Akagera Safari", price: 150, icon: "fas fa-hippo", label: "Akagera Safari" },
  { value: "Nyungwe Canopy", price: 60, icon: "fas fa-bridge", label: "Canopy Walk" },
];

// Ported from legacy pages/booking.php. The live-summary math is React state,
// and submitting now persists to Postgres via the createBooking server action.
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

  function changeGuests(delta: number) {
    setGuests((g) => Math.max(1, g + delta));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("experience", experience);
    fd.set("date", date);
    fd.set("guests", String(guests));
    fd.set("fullName", fullName);
    fd.set("email", email);
    startTransition(async () => setResult(await createBooking(fd)));
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/booking.css" />

      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-main">
            <header className="booking-header">
              <span className="step-indicator">Step 1 of 3</span>
              <h1>
                Reserve Your <span className="green-text">Experience</span>
              </h1>
            </header>

            <form id="bookingForm" onSubmit={onSubmit}>
              <div className="form-section">
                <h3>1. Select Your Wonder</h3>
                <div className="experience-selector">
                  {EXPERIENCES.map((exp) => (
                    <label className="exp-card" key={exp.value}>
                      <input
                        type="radio"
                        name="experience"
                        value={exp.value}
                        checked={experience === exp.value}
                        onChange={() => setExperience(exp.value)}
                      />
                      <div className="exp-content">
                        <i className={exp.icon}></i>
                        <span>{exp.label}</span>
                        <small>${exp.price.toLocaleString()}/pp</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Guests</label>
                  <div className="guest-picker">
                    <button type="button" onClick={() => changeGuests(-1)}>
                      -
                    </button>
                    <input type="number" value={guests} min={1} readOnly />
                    <button type="button" onClick={() => changeGuests(1)}>
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>2. Contact Details</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {result && !result.ok && (
                <p style={{ color: "#c0392b", fontWeight: 600 }}>{result.error}</p>
              )}
              {result && result.ok && (
                <p style={{ color: "#1e8e3e", fontWeight: 600 }}>
                  Booking #{result.id} confirmed — total ${result.total.toLocaleString()}.
                </p>
              )}

              <button type="submit" className="btn-confirm" disabled={pending}>
                {pending ? "Submitting…" : "Proceed to Payment"}
              </button>
            </form>
          </div>

          <aside className="booking-summary">
            <div className="summary-card">
              <h2>Booking Summary</h2>
              <div className="summary-row">
                <span>Experience</span>
                <strong>{experience}</strong>
              </div>
              <div className="summary-row">
                <span>Date</span>
                <strong>{date || "Select a date"}</strong>
              </div>
              <div className="summary-row">
                <span>Price per Person</span>
                <strong>${pricePer.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Guests</span>
                <strong>x{guests}</strong>
              </div>
              <hr />
              <div className="total-row">
                <span>Total Amount</span>
                <h2>${total.toLocaleString()}</h2>
              </div>
              <div className="safety-badge">
                <i className="fas fa-shield-check"></i> Secure &amp; Official
                Rwandan Booking
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
