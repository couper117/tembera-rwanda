"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import AccountDataSection from "@/components/profile/AccountDataSection";
import SettingsNav, { SETTINGS_SECTIONS } from "@/components/profile/SettingsNav";
import Spinner from "@/components/ui/Spinner";
import { useAccount } from "@/lib/client/account";
import { useLocation } from "@/lib/client/location";
import { clearRecentSearches, readRecentSearches } from "@/lib/client/recentSearches";
import { useSaved } from "@/lib/client/saved";
import { useTheme } from "@/lib/client/theme";
import { useVisited } from "@/lib/client/visited";
import {
  CURRENCIES,
  LANGUAGES,
  UNITS,
  type Preferences,
} from "@/lib/profile/preferences";
import { updatePreferencesAction } from "@/lib/actions/user";

/**
 * Settings, as a settings screen rather than a column of cards.
 *
 * It used to be six stacked cards in a 760px column, so finding "clear my
 * search history" meant scrolling and scanning, and two thirds of a desktop
 * screen was empty. A category rail on the left turns it into a choice: pick
 * the area, read the two switches in it — and the page uses the width it has.
 *
 * Everything that was here still is. What is new is language, currency,
 * distance units and email preferences, which were stranded on their own
 * screen under Profile where nobody would look for them.
 */

type Status = "idle" | "saving" | "saved" | "error";

export default function SettingsScreen({
  initialPreferences,
}: {
  initialPreferences: Preferences;
}) {
  const { originLabel, status: locStatus, requestLocation, coords, chosenCity, setCity } =
    useLocation();
  const { ids, clear, ready } = useSaved();
  const { visits, clear: clearVisited } = useVisited();
  const { account, authed } = useAccount();
  const { theme, toggleTheme } = useTheme();

  const [section, setSection] = useState("account");
  const [recentCount, setRecentCount] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences);
  const [prefStatus, setPrefStatus] = useState<Status>("idle");

  const visitedCount = visits.length;

  useEffect(() => {
    setRecentCount(readRecentSearches().length);
  }, []);

  /**
   * Preferences save on change rather than on a button.
   *
   * There is no half-set state to protect against — every control here is a
   * single choice, and each is independently meaningful — so a Save button
   * would only be a second thing to remember to press.
   */
  async function setPref<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (!authed) return;
    setPrefStatus("saving");
    const result = await updatePreferencesAction(next);
    setPrefStatus("error" in result ? "error" : "saved");
  }

  const current = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <>
      <PageHeader title="Settings" fallbackHref="/profile" />

      <main className="t-main">
        <div className="t-page">
          <div className="t-settings">
            <aside className="t-settings__rail">
              <h1 className="t-settings__h1">Settings</h1>
              <SettingsNav active={section} onSelect={setSection} />
            </aside>

            <div className="t-settings__pane">
              <header className="t-settings__panehead">
                <h2 className="t-settings__title">{current?.label}</h2>
                <p className="t-settings__note">{current?.note}</p>
              </header>

              {/* ------------------------------------------- account -- */}
              {section === "account" && (
                <>
                  {authed ? (
                    <>
                      <Row
                        icon="user"
                        title={account.name}
                        note={account.email}
                        action={
                          <Link href="/profile/edit" className="t-btn t-btn--secondary t-btn--sm">
                            Edit profile
                          </Link>
                        }
                      />
                      <Row
                        icon="external"
                        title="Sign out"
                        note="Ends this session on this device."
                        action={
                          <form action="/logout" method="post">
                            <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                              Sign out
                            </button>
                          </form>
                        }
                      />
                    </>
                  ) : (
                    <Row
                      icon="user"
                      title="You are browsing as a guest"
                      note="Sign in to sync your saves and reviews across devices."
                      action={
                        <Link href="/login" className="t-btn t-btn--primary t-btn--sm">
                          Sign in
                        </Link>
                      }
                    />
                  )}
                </>
              )}

              {/* ---------------------------------------- appearance -- */}
              {section === "appearance" && (
                <Row
                  icon={theme === "dark" ? "moon" : "sun"}
                  title="Dark mode"
                  note={theme === "dark" ? "On" : "Off"}
                  action={
                    <button
                      type="button"
                      role="switch"
                      aria-checked={theme === "dark"}
                      aria-label="Dark mode"
                      className="t-toggle"
                      onClick={toggleTheme}
                    >
                      <span className="t-toggle__knob" aria-hidden="true">
                        <Icon name={theme === "dark" ? "moon" : "sun"} size={13} />
                      </span>
                    </button>
                  }
                />
              )}

              {/* -------------------------------------------- region -- */}
              {section === "region" && (
                <>
                  <Choice
                    label="Language"
                    value={prefs.language}
                    onChange={(v) => setPref("language", v as Preferences["language"])}
                    options={LANGUAGES.map((l) => ({
                      value: l.id,
                      label: l.note ? `${l.label} — ${l.note}` : l.label,
                    }))}
                  />
                  <Choice
                    label="Currency"
                    value={prefs.currency}
                    onChange={(v) => setPref("currency", v as Preferences["currency"])}
                    options={CURRENCIES.map((c) => ({ value: c.id, label: c.label }))}
                  />
                  <Choice
                    label="Distance"
                    value={prefs.units}
                    onChange={(v) => setPref("units", v as Preferences["units"])}
                    options={UNITS.map((u) => ({ value: u.id, label: u.label }))}
                  />
                  <SaveHint authed={authed} status={prefStatus} />
                </>
              )}

              {/* ------------------------------------------ location -- */}
              {section === "location" && (
                <>
                  <Row
                    icon="pin"
                    title={originLabel}
                    note="Distances across the app are measured from here."
                    action={
                      (coords || chosenCity) && (
                        <button
                          type="button"
                          className="t-btn t-btn--ghost t-btn--sm"
                          onClick={() => setCity(null)}
                        >
                          Reset to Kigali
                        </button>
                      )
                    }
                  />
                  {!coords && (
                    <Row
                      icon="navigate"
                      title="Use my current location"
                      note={
                        locStatus === "denied"
                          ? "Location is blocked in your browser."
                          : "Tembera never asks on its own — only when you tap."
                      }
                      action={
                        <button
                          type="button"
                          className="t-btn t-btn--secondary t-btn--sm"
                          onClick={requestLocation}
                          disabled={locStatus === "locating" || locStatus === "denied"}
                        >
                          {locStatus === "locating" ? (
                            <>
                              <Spinner size={16} tone="current" label="Finding your location" />
                              Finding you…
                            </>
                          ) : (
                            "Use my location"
                          )}
                        </button>
                      }
                    />
                  )}
                </>
              )}

              {/* ------------------------------------- notifications -- */}
              {section === "notifications" && (
                <>
                  <Row
                    icon="mail"
                    title="Replies and decisions"
                    note="A reply to your review, or an answer about a listing you claimed."
                    action={
                      <Switch
                        label="Replies and decisions"
                        checked={prefs.emailUpdates}
                        onChange={(v) => setPref("emailUpdates", v)}
                      />
                    }
                  />
                  <Row
                    icon="bell"
                    title="New places near you"
                    note="Occasional. Off unless you ask for it."
                    action={
                      <Switch
                        label="New places near you"
                        checked={prefs.emailDigest}
                        onChange={(v) => setPref("emailDigest", v)}
                      />
                    }
                  />
                  <SaveHint authed={authed} status={prefStatus} />
                </>
              )}

              {/* ------------------------------------------- privacy -- */}
              {section === "privacy" && (
                <>
                  <p className="t-settings__lede">
                    {authed
                      ? `Your saved places (${ready ? ids.length : 0}) and visits (${visitedCount}) are synced to your account. Recent searches (${recentCount}) stay in this browser.`
                      : `Your profile, saves (${ready ? ids.length : 0}), visits (${visitedCount}) and searches (${recentCount}) are stored in this browser. Sign in to sync them.`}
                  </p>

                  <Row
                    icon="bookmark"
                    title="Saved places"
                    note={`${ready ? ids.length : 0} saved`}
                    action={
                      <button
                        type="button"
                        className="t-btn t-btn--secondary t-btn--sm"
                        onClick={clear}
                        disabled={!ready || ids.length === 0}
                      >
                        Clear
                      </button>
                    }
                  />
                  <Row
                    icon="search"
                    title="Recent searches"
                    note={`${recentCount} in this browser`}
                    action={
                      <button
                        type="button"
                        className="t-btn t-btn--secondary t-btn--sm"
                        onClick={() => {
                          clearRecentSearches();
                          setRecentCount(0);
                        }}
                        disabled={recentCount === 0}
                      >
                        Clear
                      </button>
                    }
                  />
                  <Row
                    icon="compass"
                    title="Visit history"
                    note={`${visitedCount} places`}
                    action={
                      <button
                        type="button"
                        className="t-btn t-btn--secondary t-btn--sm"
                        onClick={clearVisited}
                        disabled={visitedCount === 0}
                      >
                        Clear
                      </button>
                    }
                  />

                  {/* Export, sign-out-everywhere and deletion. Only meaningful
                      signed in — there is nothing on the server to erase for a
                      guest, and the clears above already cover them. */}
                  {authed && <AccountDataSection />}
                </>
              )}

              {/* --------------------------------------------- about -- */}
              {section === "about" && (
                <>
                  <Row
                    icon="basket"
                    title="For business"
                    note="Claim your listing and keep it current."
                    action={
                      <Link href="/business/register" className="t-btn t-btn--secondary t-btn--sm">
                        Open
                      </Link>
                    }
                  />
                  <Row
                    icon="info"
                    title="About Tembera"
                    note="What this is and who makes it."
                    action={
                      <Link href="/about" className="t-btn t-btn--secondary t-btn--sm">
                        Read
                      </Link>
                    }
                  />
                  <Row
                    icon="lock"
                    title="Privacy policy"
                    note="What we hold, and your rights over it."
                    action={
                      <Link href="/privacy" className="t-btn t-btn--secondary t-btn--sm">
                        Read
                      </Link>
                    }
                  />
                  <Row
                    icon="list"
                    title="Terms of use"
                    note="The rules for using Tembera."
                    action={
                      <Link href="/terms" className="t-btn t-btn--secondary t-btn--sm">
                        Read
                      </Link>
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/** One setting: what it is, what it currently says, and the control. */
function Row({
  icon,
  title,
  note,
  action,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="t-setrow">
      <span className="t-setrow__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="t-setrow__body">
        <span className="t-setrow__title">{title}</span>
        {note && <span className="t-setrow__note">{note}</span>}
      </span>
      {action && <span className="t-setrow__action">{action}</span>}
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="t-setrow">
      <span className="t-setrow__body">
        <span className="t-setrow__title">{label}</span>
      </span>
      <span className="t-setrow__action">
        <select
          className="t-input t-setrow__select"
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="t-toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="t-toggle__knob" aria-hidden="true" />
    </button>
  );
}

/** Says what happened to a change that saved itself. */
function SaveHint({ authed, status }: { authed: boolean; status: Status }) {
  if (!authed) {
    return (
      <p className="t-settings__hint">
        <Link href="/login">Sign in</Link> to keep these across devices.
      </p>
    );
  }
  if (status === "saving") return <p className="t-settings__hint">Saving…</p>;
  if (status === "error") {
    return <p className="t-settings__hint t-settings__hint--bad">That did not save. Try again.</p>;
  }
  if (status === "saved") {
    return (
      <p className="t-settings__hint">
        <Icon name="check" size={14} /> Saved
      </p>
    );
  }
  return <p className="t-settings__hint">Changes save as you make them.</p>;
}
