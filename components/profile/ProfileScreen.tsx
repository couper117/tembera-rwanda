"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import AppHeader from "@/components/app/AppHeader";
import Icon, { type IconName } from "@/components/Icon";
import EmptyState from "@/components/ui/EmptyState";
import PlaceCard from "@/components/ui/PlaceCard";
import PlaceRow from "@/components/ui/PlaceRow";
import { SkeletonList, SkeletonRail } from "@/components/ui/Skeleton";
import { formatJoined, initialsOf, useAccount } from "@/lib/client/account";
import { useSaved } from "@/lib/client/saved";
import { formatVisitedAt, useVisited } from "@/lib/client/visited";
import { DISTRICT_CENTRES } from "@/lib/places/geo";
import { cityGroup } from "@/lib/places/engine";
import type { Place } from "@/lib/places/types";
import ProfileEditor from "./ProfileEditor";

interface Props {
  /** Needed to resolve stored ids back into places. */
  index: Place[];
}

/** How many places each section previews before deferring to a full screen. */
const PREVIEW = 4;

/** Never hardcode this — the taxonomy is admin-editable. */
const TOTAL_DISTRICTS = Object.keys(DISTRICT_CENTRES).length;

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

  const byId = useMemo(() => new Map(index.map((place) => [place.id, place])), [index]);
  const resolve = useCallback(
    (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((place): place is Place => place !== undefined),
    [byId],
  );

  // Keeps the visit timestamp instead of discarding it, so "Recently visited"
  // can say when, not just what.
  const visited = useMemo(
    () =>
      visits
        .map((v) => ({ place: byId.get(v.id), at: v.at }))
        .filter((v): v is { place: Place; at: number } => v.place !== undefined),
    [visits, byId],
  );
  const saved = useMemo(() => resolve(savedIds), [savedIds, resolve]);

  // Districts reached — grouped, so Kigali's three sub-districts count as one
  // — ordered most-recent-first so the chips read as "your trip so far", plus
  // how many visits landed in each for the count badge.
  const { districtsVisited, districtVisitCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const { place } of visited) {
      const group = cityGroup(place);
      counts.set(group, (counts.get(group) ?? 0) + 1);
      if (!seen.has(group)) {
        seen.add(group);
        ordered.push(group);
      }
    }
    return { districtsVisited: ordered, districtVisitCounts: counts };
  }, [visited]);

  const ready = accountReady && savedReady && visitedReady;

  function clearHistory() {
    clearVisited();
  }

  const visitedRef = useRef<HTMLElement>(null);
  const savedRef = useRef<HTMLElement>(null);
  const districtsRef = useRef<HTMLElement>(null);
  const jump = (ref: RefObject<HTMLElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const sectionOffset = { scrollMarginTop: "calc(var(--t-header-h) + var(--t-4))" } as const;

  return (
    <>
      <AppHeader />

      <main className="t-main">
        {/* Wider than About's reading-width column (720px read as a
            sliver next to the rail on a real desktop screen) but short of the
            site's full 1240px content width — that would spread the 3-stat
            row and header thin instead of just closing the outer margin. */}
        <div className="t-page" style={{ maxWidth: 960 }}>
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
                  <Stat
                    icon="compass"
                    value={visited.length}
                    label="Places visited"
                    ready={ready}
                    onClick={() => jump(visitedRef)}
                  />
                  <Stat
                    icon="bookmark"
                    value={saved.length}
                    label="Saved"
                    ready={ready}
                    onClick={() => jump(savedRef)}
                  />
                  <Stat
                    icon="pin"
                    value={districtsVisited.length}
                    label="Districts"
                    ready={ready}
                    onClick={districtsVisited.length > 0 ? () => jump(districtsRef) : undefined}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ---------------------------------------------- districts --- */}
          {visitedReady && districtsVisited.length > 0 && (
            <section className="t-section" ref={districtsRef} style={sectionOffset}>
              <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
                Districts explored
              </h2>
              <div className="t-scroller">
                {districtsVisited.map((name) => (
                  <Link
                    key={name}
                    href={`/city/${encodeURIComponent(name)}`}
                    className="t-chip t-chip--visited"
                  >
                    {name}
                    <span className="t-chip__count">{districtVisitCounts.get(name)}</span>
                  </Link>
                ))}
              </div>
              <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                {districtsVisited.length} of {TOTAL_DISTRICTS} districts
              </p>
            </section>
          )}

          {/* -------------------------------------------------- visited -- */}
          <section className="t-section" ref={visitedRef} style={sectionOffset}>
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
                  {visited.slice(0, PREVIEW).map(({ place, at }) => (
                    <PlaceRow key={place.id} place={place} note={`Visited ${formatVisitedAt(at)}`} />
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
          <section className="t-section" ref={savedRef} style={sectionOffset}>
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
              <SkeletonRail count={4} />
            ) : saved.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="Nothing saved yet"
                text="Tap the bookmark on any place to keep it here."
                actions={[{ label: "Browse places", href: "/explore", variant: "secondary" }]}
              />
            ) : (
              <div className="t-scroller">
                {saved.slice(0, PREVIEW).map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </section>

          {/* -------------------------------------------------- account -- */}
          <section className="t-section">
            <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
              Account
            </h2>

            <div className="t-stack-3">
              <div className="t-card">
                <Row icon="settings" label="Settings" href="/settings" />
                <Row icon="calendar" label="Rwanda calendar" href="/calendar" />
              </div>

              <div className="t-card">
                <Row icon="info" label="About Tembera" href="/about" />
                <Row icon="lock" label="Admin sign in" href="/admin" />
                {!authed && <Row icon="user" label="Sign in" href="/login" />}
              </div>
            </div>

            {authed && (
              <form action="/logout" method="post" style={{ marginTop: "var(--t-4)" }}>
                <button
                  type="submit"
                  className="t-small"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    font: "inherit",
                    fontWeight: 700,
                    color: "var(--t-danger)",
                  }}
                >
                  Sign out
                </button>
              </form>
            )}

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

function Stat({
  icon,
  value,
  label,
  ready,
  onClick,
}: {
  icon: IconName;
  value: number;
  label: string;
  ready: boolean;
  /** Scrolls to the matching section below. Omit to render a plain stat. */
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="t-profile__statvalue">{ready ? value : "—"}</span>
      <span className="t-profile__statlabel t-small t-muted">
        <Icon name={icon} size={13} />
        {label}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="t-profile__stat">{content}</div>;
  }

  return (
    <button type="button" className="t-profile__stat" onClick={onClick}>
      {content}
    </button>
  );
}

function Row({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <Link href={href} className="t-fact" style={{ padding: "var(--t-3) var(--t-4)", alignItems: "center" }}>
      <span className="t-fact__icon t-fact__icon--accent">
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
