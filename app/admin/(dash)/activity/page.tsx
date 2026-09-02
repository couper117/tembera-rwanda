import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { PageHead, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { recentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Actions are recorded as "<entity>.<verb>". The verb picks the icon, so a new
 * action type gets a sensible glyph without this map having to know about it.
 */
const GLYPH: Record<string, IconName> = {
  create: "plus",
  update: "refresh",
  delete: "broom",
  hide: "lock",
  show: "check",
  resolved: "check",
  dismissed: "close",
  open: "refresh",
  approve: "check",
  reject: "close",
  role: "user",
};

function glyphFor(action: string): IconName {
  return GLYPH[action.split(".")[1] ?? ""] ?? "clock";
}

/** "/admin/places/x" for the entities that have their own screen. */
function linkFor(entity: string, entityId: string): string | null {
  switch (entity) {
    case "place":
      return `/admin/places/${entityId}`;
    case "review":
      return "/admin/reviews";
    case "report":
      return "/admin/reports";
    case "user":
      return "/admin/users";
    default:
      return null;
  }
}

/** "20 Aug 2026, 14:32" — an audit trail needs the time, not just the day. */
function stamp(at: Date): string {
  return at.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivityPage() {
  await requireStaff();
  const events = await recentAudit({ take: 100 });

  return (
    <>
      <PageHead
        title="Activity"
        sub="Who changed what, and when. An audit trail for a system the government has to answer for."
      />

      <Panel title="Recent actions" flush>
        {events.length === 0 ? (
          <p className="a-empty">
            Nothing recorded yet. Every change made from this dashboard is
            written here.
          </p>
        ) : (
          <div className="a-queue">
            {events.map((event) => {
              const href = linkFor(event.entity, event.entityId);
              const target = (
                <>
                  {event.entity} <strong>{event.entityId}</strong>
                </>
              );
              return (
                <div key={event.id} className="a-queue__item">
                  <span className="a-queue__icon">
                    <Icon name={glyphFor(event.action)} size={17} />
                  </span>
                  <span className="a-queue__body">
                    <span className="a-queue__name">
                      {event.actor?.name ?? "A removed account"}{" "}
                      <code>{event.action}</code>{" "}
                      {href ? <Link href={href}>{target}</Link> : target}
                    </span>
                    <span className="a-queue__meta">{stamp(event.createdAt)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
