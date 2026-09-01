"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import {
  EVENT_KIND_META,
  daysBetween,
  formatShortDate,
  kindStyleVars,
  type CalendarEvent,
} from "@/lib/rwanda/events";

/**
 * What is coming up, under the bell.
 *
 * It was a bottom sheet, which is the right shape for something you have to
 * deal with and the wrong one for three dates you are glancing at — it dimmed
 * the page and took over the screen to say "Umuganda is in nine days".
 */
export default function NotificationsMenu({
  events,
  todayIso,
  onNavigate,
}: {
  events: CalendarEvent[];
  todayIso: string;
  onNavigate: () => void;
}) {
  return (
    <div className="t-menu">
      <div className="t-menu__head">
        <span className="t-menu__headtitle">Notifications</span>
        <span className="t-menu__headnote">From the Rwanda calendar</span>
      </div>

      {events.length === 0 ? (
        <div className="t-menu__empty">
          <span className="t-menu__emptyicon">
            <Icon name="bell" size={20} />
          </span>
          <p className="t-menu__emptytext">
            You&apos;re all caught up — nothing left on the calendar this year.
          </p>
        </div>
      ) : (
        events.map((event) => (
          <Link
            key={event.id}
            href="/calendar"
            className="t-menuevent"
            style={kindStyleVars(event.kind)}
            onClick={onNavigate}
          >
            <span className="t-menuevent__icon">
              <Icon name={EVENT_KIND_META[event.kind].icon} size={17} />
            </span>
            <span className="t-menuevent__body">
              <span className="t-menuevent__name">{event.title}</span>
              <span className="t-menuevent__note">
                {formatShortDate(event.date)} · {event.summary}
              </span>
            </span>
            <span className="t-badge t-menuevent__when">
              {event.date === todayIso ? "Today" : `${daysBetween(todayIso, event.date)}d`}
            </span>
          </Link>
        ))
      )}

      <div className="t-menu__foot">
        <Link href="/calendar" className="t-menu__item" onClick={onNavigate}>
          <Icon name="calendar" size={17} />
          Open the calendar
        </Link>
      </div>
    </div>
  );
}
