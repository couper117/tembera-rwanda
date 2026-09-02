"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import AppHeader from "@/components/app/AppHeader";
import Icon, { type IconName } from "@/components/Icon";
import PlaceRow from "@/components/ui/PlaceRow";
import { formatJoined, initialsOf, useAccount } from "@/lib/client/account";
import { useSaved } from "@/lib/client/saved";
import { useVisited } from "@/lib/client/visited";
import { cityGroup } from "@/lib/places/engine";
import { DISTRICT_CENTRES } from "@/lib/places/geo";
import { INTERESTS, interestById } from "@/lib/profile/interests";
import type { Place } from "@/lib/places/types";
import { updateInterestsAction } from "@/lib/actions/user";

/**
 * The profile, rebuilt around identity rather than around a form.
 *
 * The old page was one gradient card with every setting inside it, which read
 * as an admin screen bolted onto a travel app. The rethink is: a profile is
 * something you *look at*, and only occasionally something you edit. So the
 * overview is entirely read-only — a person, what they have done, and what
 * they are into — and editing lives on its own screen where it can have room.
 *
 * There is one card on this page, for the stats, and it earns its place by
 * grouping four numbers that only mean anything together. Everything else is
 * separated by whitespace and a hairline, because a border around a heading
 * and three rows is a box drawn for the sake of drawing a box.
 *
 * Every figure comes from real activity. A profile that invents "12 places
 * visited" is worse than one that admits to none, since the numbers are the
 * entire reason anybody opens it.
 */

interface Activity {
  kind: "visited" | "saved" | "reviewed";
  placeId: string;
  at: number;
  rating?: number;
}

export interface ProfileServerData {
  image: string | null;
  interests: string[];
  reviews: { placeId: string; rating: number; at: number }[];
  saves: { placeId: string; at: number }[];
  visits: { placeId: string; at: number }[];
}

const TOTAL_DISTRICTS = Object.keys(DISTRICT_CENTRES).length;

export default function ProfileOverview({
  index,
  server,
}: {
  index: Place[];
  /** Null for a guest — everything then comes from this browser. */
  server: ProfileServerData | null;
}) {
  const { account, ready: accountReady, authed } = useAccount();
  const { ids: savedIds, ready: savedReady } = useSaved();
  const { visits, ready: visitedReady } = useVisited();

  const [interests, setInterests] = useState<string[]>(server?.interests ?? []);
  const [editingInterests, setEditingInterests] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(index.map((p) => [p.id, p])), [index]);
  const resolve = useCallback((id: string) => byId.get(id), [byId]);

  const visited = useMemo(
    () =>
      visits
        .map((v) => ({ place: byId.get(v.id), at: v.at }))
        .filter((v): v is { place: Place; at: number } => v.place !== undefined),
    [visits, byId],
  );

  const saved = useMemo(
    () => savedIds.map((id) => byId.get(id)).filter((p): p is Place => p !== undefined),
    [savedIds, byId],
  );

  /** Districts reached, most visits first, so the list reads as a trip record. */
  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { place } of visited) {
      const group = cityGroup(place);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [visited]);

  /**
   * One chronological stream out of three sources.
   *
   * Saves only carry a timestamp for a signed-in account — the browser store
   * keeps ids and nothing else — so a guest's feed is visits alone rather than
   * saves with a made-up date on them.
   */
  const activity = useMemo(() => {
    const out: Activity[] = [];
    for (const v of visits) out.push({ kind: "visited", placeId: v.id, at: v.at });
    if (server) {
      for (const s of server.saves) out.push({ kind: "saved", placeId: s.placeId, at: s.at });
      for (const r of server.reviews) {
        out.push({ kind: "reviewed", placeId: r.placeId, at: r.at, rating: r.rating });
      }
    }
    return out
      .filter((a) => byId.has(a.placeId))
      .sort((a, b) => b.at - a.at)
      .slice(0, 8);
  }, [visits, server, byId]);

  const reviewCount = server?.reviews.length ?? 0;
  const ready = accountReady && savedReady && visitedReady;

  async function saveInterests(next: string[]) {
    setInterests(next);
    if (!authed) return;
    setSavingInterests(true);
    setInterestError(null);
    const result = await updateInterestsAction(next);
    setSavingInterests(false);
    if ("error" in result) setInterestError(result.error);
  }

  return (
    <>
      <AppHeader />

      <main className="t-main">
        {/* Full width. The old page capped itself at 960px, which on a desktop
            left the rail on one side and a stripe of nothing on the other. */}
        <div className="t-page">
          {/* ---------------------------------------------- identity --- */}
          <header className="t-prof__head">
            <span className="t-prof__avatar">
              {server?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={server.image} alt="" className="t-prof__photo" />
              ) : (
                <span aria-hidden="true">{accountReady ? initialsOf(account.name) : ""}</span>
              )}
            </span>

            <div className="t-prof__id">
              <h1 className="t-prof__name">
                {accountReady ? (
                  account.name
                ) : (
                  <span className="t-skel t-skel--line" style={{ width: "10rem" }} />
                )}
              </h1>
              <p className="t-prof__handle">@{account.handle}</p>

              <div className="t-prof__meta">
                <span>
                  <Icon name="pin" size={15} />
                  {account.homeCity}
                </span>
                <span>
                  <Icon name="clock" size={15} />
                  Joined {formatJoined(account.joinedAt)}
                </span>
              </div>

              {account.bio && <p className="t-prof__bio">{account.bio}</p>}
            </div>

            <div className="t-prof__headactions">
              <Link href="/profile/edit" className="t-btn t-btn--secondary t-btn--sm">
                <Icon name="sliders" size={15} />
                Edit profile
              </Link>
            </div>
          </header>

          {/* ------------------------------------------------ journey --- */}
          <section className="t-prof__section">
            <h2 className="t-prof__h2">Your Rwanda journey</h2>
            <div className="t-journey">
              <Figure value={visited.length} label="Places visited" ready={ready} />
              <Figure
                value={districts.length}
                label="Districts explored"
                note={`of ${TOTAL_DISTRICTS}`}
                ready={ready}
              />
              <Figure value={saved.length} label="Saved places" ready={ready} />
              <Figure
                value={reviewCount}
                label="Reviews written"
                ready={ready}
                note={authed ? undefined : "sign in to keep"}
              />
            </div>
          </section>

          {/* ---------------------------------------------- districts --- */}
          <section className="t-prof__section">
            <h2 className="t-prof__h2">Districts explored</h2>
            {districts.length > 0 ? (
              <ul className="t-districts">
                {districts.map((d) => (
                  <li key={d.name}>
                    <Link href={`/city/${encodeURIComponent(d.name)}`} className="t-district">
                      <span className="t-district__name">{d.name}</span>
                      <span className="t-district__count">
                        {d.count} {d.count === 1 ? "place" : "places"}
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                icon="pin"
                text="No districts yet. Open a place and it lands here."
                action={{ label: "Start exploring", href: "/explore" }}
              />
            )}
          </section>

          {/* ---------------------------------------------- interests --- */}
          <section className="t-prof__section">
            <div className="t-prof__h2row">
              <h2 className="t-prof__h2">Travel interests</h2>
              <button
                type="button"
                className="t-btn t-btn--ghost t-btn--sm"
                onClick={() => setEditingInterests((v) => !v)}
              >
                {editingInterests ? "Done" : "Edit interests"}
              </button>
            </div>

            {editingInterests ? (
              <>
                <div className="t-pills">
                  {INTERESTS.map((interest) => {
                    const on = interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        className={`t-pill${on ? " t-pill--on" : ""}`}
                        aria-pressed={on}
                        onClick={() =>
                          saveInterests(
                            on
                              ? interests.filter((i) => i !== interest.id)
                              : [...interests, interest.id],
                          )
                        }
                      >
                        <Icon name={interest.icon} size={15} />
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
                <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                  {savingInterests
                    ? "Saving…"
                    : interestError
                      ? interestError
                      : authed
                        ? "Saved as you choose. We will use these to suggest places."
                        : "Sign in to keep these across devices."}
                </p>
              </>
            ) : interests.length > 0 ? (
              <div className="t-pills">
                {interests.map((id) => {
                  const interest = interestById(id);
                  if (!interest) return null;
                  return (
                    <span key={id} className="t-pill t-pill--on">
                      <Icon name={interest.icon} size={15} />
                      {interest.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <Empty
                icon="sparkle"
                text="Tell us what you travel for and we will point you at it."
                action={{ label: "Choose interests", onClick: () => setEditingInterests(true) }}
              />
            )}
          </section>

          {/* ----------------------------------------------- activity --- */}
          <section className="t-prof__section">
            <h2 className="t-prof__h2">Recent activity</h2>
            {activity.length > 0 ? (
              <ul className="t-feed">
                {activity.map((item) => {
                  const place = resolve(item.placeId);
                  if (!place) return null;
                  return (
                    <li key={`${item.kind}-${item.placeId}-${item.at}`} className="t-feed__item">
                      <span className={`t-feed__icon t-feed__icon--${item.kind}`}>
                        <Icon name={FEED_ICON[item.kind]} size={16} />
                      </span>
                      <span className="t-feed__body">
                        <Link href={`/place/${place.id}`} className="t-feed__name">
                          {place.name}
                        </Link>
                        <span className="t-feed__what">
                          {FEED_VERB[item.kind]}
                          {item.rating !== undefined && ` · ${item.rating}/5`}
                          {" · "}
                          {relative(item.at)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty
                icon="clock"
                text="Nothing yet. Saving and visiting places will show up here."
                action={{ label: "Find somewhere", href: "/explore" }}
              />
            )}
          </section>

          {/* -------------------------------------------------- saved --- */}
          {saved.length > 0 && (
            <section className="t-prof__section">
              <div className="t-prof__h2row">
                <h2 className="t-prof__h2">Saved places</h2>
                <Link href="/saved" className="t-btn t-btn--ghost t-btn--sm">
                  See all
                  <Icon name="chevronRight" size={15} />
                </Link>
              </div>
              <div className="t-list">
                {saved.slice(0, 4).map((place) => (
                  <PlaceRow key={place.id} place={place} />
                ))}
              </div>
            </section>
          )}

          {/* ------------------------------------------------ account --- */}
          <section className="t-prof__section">
            <h2 className="t-prof__h2">Account</h2>
            <ul className="t-prof__links">
              <ProfileLink
                href="/settings"
                icon="settings"
                title="Settings"
                note="Language, location, notifications and appearance"
              />
              <ProfileLink
                href="/settings"
                icon="lock"
                title="Privacy & your data"
                note="Export, sign out everywhere, delete account"
              />
              {/* Signing out had no button anywhere in the product. It belongs
                  at the bottom of the account list — the last thing you do on
                  the screen, and not next to anything you might mean instead. */}
              <li>
                <form action="/logout" method="post">
                  <button type="submit" className="t-proflink t-proflink--quiet">
                    <span className="t-proflink__icon">
                      <Icon name="external" size={18} />
                    </span>
                    <span className="t-proflink__body">
                      <span className="t-proflink__title">Sign out</span>
                      <span className="t-proflink__note">Ends this session on this device</span>
                    </span>
                  </button>
                </form>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

const FEED_ICON: Record<Activity["kind"], IconName> = {
  visited: "compass",
  saved: "bookmark",
  reviewed: "star",
};

const FEED_VERB: Record<Activity["kind"], string> = {
  visited: "Visited",
  saved: "Saved",
  reviewed: "Reviewed",
};

/** "3 days ago" reads better than a date on a feed this short. */
function relative(at: number): string {
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/** One number. Deliberately not a card — four boxes for four integers is the
 *  layout that made the old page look like a dashboard. */
function Figure({
  value,
  label,
  note,
  ready,
}: {
  value: number;
  label: string;
  note?: string;
  ready: boolean;
}) {
  return (
    <div className="t-figure">
      <span className="t-figure__value">
        {ready ? value : <span className="t-skel t-skel--line" style={{ width: "1.6rem" }} />}
      </span>
      <span className="t-figure__label">{label}</span>
      {note && <span className="t-figure__note">{note}</span>}
    </div>
  );
}

/** An empty section that looks deliberate rather than broken. */
function Empty({
  icon,
  text,
  action,
}: {
  icon: IconName;
  text: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="t-profempty">
      <Icon name={icon} size={18} />
      <p>{text}</p>
      {action &&
        (action.href ? (
          <Link href={action.href} className="t-btn t-btn--secondary t-btn--sm">
            {action.label}
          </Link>
        ) : (
          <button type="button" className="t-btn t-btn--secondary t-btn--sm" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

function ProfileLink({
  href,
  icon,
  title,
  note,
}: {
  href: string;
  icon: IconName;
  title: string;
  note: string;
}) {
  return (
    <li>
      <Link href={href} className="t-proflink">
        <span className="t-proflink__icon">
          <Icon name={icon} size={18} />
        </span>
        <span className="t-proflink__body">
          <span className="t-proflink__title">{title}</span>
          <span className="t-proflink__note">{note}</span>
        </span>
        <Icon name="chevronRight" size={17} />
      </Link>
    </li>
  );
}
