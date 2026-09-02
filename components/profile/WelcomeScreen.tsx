"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";

import { DISTRICT_CENTRES } from "@/lib/places/geo";
import { INTEREST_CHOICES } from "@/lib/home/rows";
import { DEFAULT_PREFERENCES, UNITS, type Units } from "@/lib/profile/preferences";
import {
  updateInterestsAction,
  updatePreferencesAction,
  updateProfileAction,
} from "@/lib/actions/user";

/**
 * The three questions worth asking a new account.
 *
 * Every one of them changes what the app does the moment it is answered: the
 * interests decide which rows the home page leads with, the city decides what
 * "near you" means, and the units decide how every distance in the product is
 * written. Nothing else is asked. An onboarding that collects a fact nobody
 * reads is a toll booth on the way in, and the way to keep it honest is to
 * only ask for things that are already wired to something.
 *
 * Skippable, and it says so. Somebody who wants to look around first gets the
 * unpersonalised home, which is the page everyone used to get — personalisation
 * adds, it never withholds. They can answer later from Preferences.
 */

const STEPS = ["What brings you to Rwanda?", "Where are you based?", "One last thing"];

export default function WelcomeScreen({
  name,
  handle,
  email,
  bio,
  homeCity,
  initialInterests,
}: {
  name: string;
  /** Carried through so saving the district does not blank the rest. */
  handle: string;
  email: string;
  bio: string;
  homeCity: string;
  initialInterests: string[];
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [city, setCity] = useState(homeCity);
  const [units, setUnits] = useState<Units>(DEFAULT_PREFERENCES.units);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = useMemo(() => {
    const districts = Object.keys(DISTRICT_CENTRES).sort((a, b) => a.localeCompare(b));
    return ["Kigali", ...districts.filter((n) => n !== "Kigali")];
  }, []);

  const firstName = name.split(/\s+/)[0] || "there";

  async function finish() {
    setSaving(true);
    setError(null);
    const [a, b] = await Promise.all([
      updateInterestsAction(interests),
      updatePreferencesAction({ ...DEFAULT_PREFERENCES, units }),
    ]);
    // Straight to the action: this screen sits outside the site layout, so
    // there is no AccountProvider to go through — which is the point, since
    // that layout is what brings the rail and the tab bar with it.
    if (city !== homeCity) {
      await updateProfileAction({ name, handle, email, bio, homeCity: city });
    }
    setSaving(false);

    const failed = [a, b].find((r) => "error" in r);
    if (failed && "error" in failed) {
      setError(failed.error);
      return;
    }
    // Straight to the home page, which is now built out of what they just
    // said — the answer to "why did you ask me that" should be visible
    // immediately rather than buried in a settings screen.
    router.push("/");
  }

  return (
    <div className="t-flow">
      <header className="t-flow__bar">
        <span className="t-flow__brand">
          <Icon name="pin" size={20} />
          Tembera
        </span>
        {/* Always available, and only in the bar — it appeared twice on the
            same screen, which reads as two different offers. Somebody who
            wants to look around first gets the unpersonalised page, which is
            no worse than what everyone had before. */}
        <Link href="/" className="t-welcome__skip">
          Skip for now
        </Link>
      </header>

      <main className="t-flow__main">
        <div className="t-welcome">
          <p className="t-welcome__step">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="t-welcome__title">
            {step === 0 ? `Welcome, ${firstName}.` : STEPS[step]}
          </h1>

          {step === 0 && (
            <>
              <p className="t-welcome__lede">
                Tell us what you travel for and the home page will lead with it.
                Pick as many as you like — you can change these any time.
              </p>
              <div className="t-pills t-welcome__pills">
                {INTEREST_CHOICES.map((interest) => {
                  const on = interests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      className={`t-pill${on ? " t-pill--on" : ""}`}
                      aria-pressed={on}
                      onClick={() =>
                        setInterests((list) =>
                          on ? list.filter((i) => i !== interest.id) : [...list, interest.id],
                        )
                      }
                    >
                      <Icon name={interest.icon} size={16} />
                      {interest.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="t-welcome__lede">
                We use this to work out what is near you, and nothing else.
              </p>
              <div className="t-welcome__field">
                <label htmlFor="w-city" className="t-formfield__label">
                  Home district
                </label>
                <select
                  id="w-city"
                  className="t-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="t-welcome__lede">
                How should we write distances? Every &ldquo;2 km away&rdquo; in
                the app follows this.
              </p>
              <div className="t-pills t-welcome__pills">
                {UNITS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={`t-pill${units === u.id ? " t-pill--on" : ""}`}
                    aria-pressed={units === u.id}
                    onClick={() => setUnits(u.id)}
                  >
                    {u.label}
                  </button>
                ))}
              </div>

              {interests.length > 0 && (
                <p className="t-welcome__recap">
                  <Icon name="check" size={15} />
                  Your home page will lead with{" "}
                  {INTEREST_CHOICES.filter((i) => interests.includes(i.id))
                    .map((i) => i.label.toLowerCase())
                    .join(", ")}
                  .
                </p>
              )}
            </>
          )}

          {error && (
            <div className="t-notice t-notice--danger" role="alert">
              <span className="t-notice__icon">
                <Icon name="alert" size={16} />
              </span>
              <div className="t-notice__body">{error}</div>
            </div>
          )}

          <div className="t-welcome__actions">
            {step > 0 && (
              <button
                type="button"
                className="t-btn t-btn--secondary"
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
              >
                Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="t-btn t-btn--primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
                <Icon name="chevronRight" size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="t-btn t-btn--primary"
                onClick={finish}
                disabled={saving}
              >
                {saving ? "Setting up…" : "Start exploring"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
