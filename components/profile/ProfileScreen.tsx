"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import AppHeader from "@/components/app/AppHeader";
import Icon, { type IconName } from "@/components/Icon";
import EmptyState from "@/components/ui/EmptyState";
import PlaceRow from "@/components/ui/PlaceRow";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatJoined, initialsOf, useAccount } from "@/lib/client/account";
import { useSaved } from "@/lib/client/saved";
import { useVisited } from "@/lib/client/visited";
import type { Place } from "@/lib/places/types";
import ProfileEditor from "./ProfileEditor";

interface Props {
  /** Needed to resolve stored ids back into places. */
  index: Place[];
}

/** How many places each section previews before deferring to a full screen. */
const PREVIEW = 4;

/**
 * The account screen. Tembera has no sign-in, so there is exactly one profile
 * and it lives in this browser — every number on it comes from what you have
 * actually done in the app rather than from seeded activity.
 */
export default function ProfileScreen({ index }: Props) {
  const { account, ready: accountReady, authed } = useAccount();
  const { ids: savedIds, ready: savedReady } = useSaved();
  const { visits, ready: visitedReady, clear: clearVisited } = useVisited();

  const [editing, setEditing] = useState(false);

  const visitedIds = useMemo(() => visits.map((v) => v.id), [visits]);

  const byId = useMemo(() => new Map(index.map((place) => [place.id, place])), [index]);
  const resolve = useCallback(
    (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((place): place is Place => place !== undefined),
    [byId],
  );

  const visited = useMemo(() => resolve(visitedIds), [visitedIds, resolve]);
  const saved = useMemo(() => resolve(savedIds), [savedIds, resolve]);

  /** Districts reached — a real number, derived from the places you've opened. */
  const districts = useMemo(
    () => new Set(visited.map((place) => place.city)).size,
    [visited],
  );

  const ready = accountReady && savedReady && visitedReady;

  function clearHistory() {
    clearVisited();
  }

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 720 }}>
          {/* ------------------------------------------------- identity -- */}
          <section className="t-section">
            {editing ? (
              <ProfileEditor onDone={() => setEditing(false)} />
            ) : (
              <div className="t-card t-profile">
                <div className="t-profile__top">
                  <span className="t-avatar" aria-hidden="true">
                    {accountReady ? initialsOf(account.name) : ""}
                  </span>

                  <div className="t-profile__id">
                    <h1 className="t-title t-truncate">
                      {accountReady ? (
                        account.name
                      ) : (
                        <span
                          className="t-skel t-skel--line"
                          style={{ display: "inline-block", width: "9rem" }}
                        />
                      )}
                    </h1>
                    <p className="t-small t-muted t-truncate">@{account.handle}</p>
                  </div>

                  <button
                    type="button"
                    className="t-btn t-btn--secondary t-btn--sm"
                    onClick={() => setEditing(true)}
                    disabled={!accountReady}
                  >
                    Edit
                  </button>
                </div>

                {account.bio && <p className="t-body t-profile__bio">{account.bio}</p>}

                <div className="t-profile__meta">
                  <span className="t-profile__metaitem">
                    <Icon name="pin" size={15} />
                    {account.homeCity}
                  </span>
                  <span className="t-profile__metaitem">
                    <Icon name="clock" size={15} />
                    Joined {formatJoined(account.joinedAt)}
                  </span>
                </div>

                <div className="t-profile__stats">
                  <Stat value={visited.length} label="Places visited" ready={ready} />
                  <Stat value={saved.length} label="Saved" ready={ready} />
                  <Stat value={districts} label="Districts" ready={ready} />
                </div>
              </div>
            )}
          </section>

          {/* -------------------------------------------------- visited -- */}
          <section className="t-section">
            <div className="t-inline" style={{ marginBottom: "var(--t-2)" }}>
              <h2 className="t-label" style={{ flex: 1 }}>
                Recently visited
              </h2>
              {visited.length > 0 && (
                <button type="button" className="t-btn t-btn--ghost t-btn--sm" onClick={clearHistory}>
                  Clear
                </button>
              )}
            </div>

            {!visitedReady ? (
              <SkeletonList count={3} />
            ) : visited.length === 0 ? (
              <EmptyState
                icon="compass"
                title="No places visited yet"
                text="Places you open show up here, so you can find your way back to them."
                actions={[{ label: "Start exploring", href: "/explore", variant: "primary" }]}
              />
            ) : (
              <>
                <div className="t-list">
                  {visited.slice(0, PREVIEW).map((place) => (
                    <PlaceRow key={place.id} place={place} />
                  ))}
                </div>
                {visited.length > PREVIEW && (
                  <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                    and {visited.length - PREVIEW} more
                  </p>
                )}
              </>
            )}
          </section>

          {/* ---------------------------------------------------- saved -- */}
          <section className="t-section">
            <div className="t-inline" style={{ marginBottom: "var(--t-2)" }}>
              <h2 className="t-label" style={{ flex: 1 }}>
                Saved places
              </h2>
              {saved.length > PREVIEW && (
                <Link href="/saved" className="t-btn t-btn--ghost t-btn--sm">
                  See all
                </Link>
              )}
            </div>

            {!savedReady ? (
              <SkeletonList count={3} />
            ) : saved.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="Nothing saved yet"
                text="Tap the bookmark on any place to keep it here."
                actions={[{ label: "Browse places", href: "/explore", variant: "secondary" }]}
              />
            ) : (
              <div className="t-list">
                {saved.slice(0, PREVIEW).map((place) => (
                  <PlaceRow key={place.id} place={place} />
                ))}
              </div>
            )}
          </section>

          {/* -------------------------------------------------- account -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Account
            </h2>
            <div className="t-card">
              <Row icon="settings" label="Settings" href="/settings" />
              <Row icon="ticket" label="Your bookings" href="/booking" />
              <Row icon="calendar" label="Rwanda calendar" href="/calendar" />
              <Row icon="info" label="About Tembera" href="/about" />
              <Row icon="lock" label="Admin sign in" href="/admin" />
              {authed ? (
                <form action="/logout" method="post">
                  <button
                    type="submit"
                    className="t-fact"
                    style={{
                      width: "100%",
                      padding: "var(--t-3) var(--t-4)",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      font: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span className="t-fact__icon">
                      <Icon name="external" size={17} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }} className="t-row__name">
                      Sign out
                    </span>
                  </button>
                </form>
              ) : (
                <Row icon="user" label="Sign in" href="/login" />
              )}
            </div>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-3)" }}>
              {authed
                ? "Your profile, saved places, visits and reviews are saved to your account and sync across devices."
                : "You're browsing as a guest — your saves and history live in this browser. Sign in to keep them across devices."}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({ value, label, ready }: { value: number; label: string; ready: boolean }) {
  return (
    <div className="t-profile__stat">
      <span className="t-profile__statvalue">{ready ? value : "—"}</span>
      <span className="t-small t-muted">{label}</span>
    </div>
  );
}

function Row({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <Link href={href} className="t-fact" style={{ padding: "var(--t-3) var(--t-4)", alignItems: "center" }}>
      <span className="t-fact__icon">
        <Icon name={icon} size={17} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }} className="t-row__name">
        {label}
      </span>
      <span className="t-row__chev">
        <Icon name="chevronRight" size={18} />
      </span>
    </Link>
  );
}
