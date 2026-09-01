import Link from "next/link";
import Icon from "@/components/Icon";
import { CountStrip, PageHead, Stat } from "@/components/admin/ui";
import TrendChart from "@/components/admin/TrendChart";
import { adminDate } from "@/lib/admin/placeholder";
import { recentAudit } from "@/lib/audit";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
import { adminBusinesses, adminSubmissions } from "@/lib/data/business";
import { openReportCount } from "@/lib/data/moderation";
import { getAllPlaces } from "@/lib/data/places";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Every figure on this screen now comes from the database.
  const [catalog, taxonomy, cityList, users, openReports, activity, submissions, businesses] =
    await Promise.all([
      getAllPlaces(),
      getCategories(),
      getCities(),
      prisma.user.count(),
      openReportCount(),
      recentAudit({ take: 5 }),
      adminSubmissions(),
      adminBusinesses(),
    ]);

  // An EDITOR cannot open Users or Businesses, so they do not get a tile that
  // only leads to a redirect. The guard is on those screens; this is just not
  // dangling a door they cannot walk through.
  const admin = isAdmin(await getCurrentUser());

  const places = catalog.length;
  const categories = taxonomy.length;
  const cities = cityList.length;
  const drafts = catalog.filter((p) => p.status === "draft").length;
  const missingPhoto = catalog.filter((p) => !p.image).length;

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  // Eight buckets of seven days, oldest first. Derived rather than stored: at
  // this volume counting in memory is cheaper than a grouped query, and a
  // hardcoded series is a chart that lies.
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weeklySubmissions = Array.from({ length: 8 }, (_, i) => {
    const from = now - (8 - i) * WEEK;
    const to = from + WEEK;
    return submissions.filter((s) => {
      const at = s.createdAt.getTime();
      return at >= from && at < to;
    }).length;
  });
  const unverified = businesses.filter((b) => b.status === "unverified").length;

  return (
    <>
      <PageHead
        title="Dashboard"
        sub="What needs attention today, and how the catalogue is growing."
        actions={
          <>
            <Link href="/admin/places/new" className="t-btn t-btn--secondary t-btn--sm">
              <Icon name="plus" size={15} />
              Add place
            </Link>
            <Link href="/admin/submissions" className="t-btn t-btn--primary t-btn--sm">
              <Icon name="mail" size={15} />
              Review submissions
            </Link>
          </>
        }
      />

      {/* What is waiting on somebody. Four queues, and a queue at zero looks
          different from a queue with work in it — that difference is the whole
          job of this row. The size of the catalogue is a separate question and
          sits at the bottom of the page, where it belongs. */}
      <h2 className="a-statsgroup">Needs attention</h2>
      <div className="a-stats a-stats--4">
        <Stat
          attention
          label="Open reports"
          value={openReports}
          icon="alert"
          note="problems visitors sent in"
          href="/admin/reports"
        />
        <Stat
          attention
          label="Submissions"
          value={pendingSubmissions.length}
          icon="mail"
          note="awaiting review"
          href="/admin/submissions"
        />
        <Stat
          attention
          label="Drafts"
          value={drafts}
          icon="pin"
          note="not published yet"
          href="/admin/places?status=draft"
        />
        <Stat
          attention
          label="Missing a photo"
          value={missingPhoto}
          icon="image"
          note={`of ${places.toLocaleString()} listings`}
          href="/admin/places?gap=no-photo"
        />
      </div>

      {/* The two things an editor reads: what is waiting, and what just
          happened. Plain sections divided by a hairline rather than panels
          inside a page — the old version put a bordered box inside a bordered
          layout, and an empty queue then rendered as a large box containing
          the words "nothing waiting" and a chart nailed to its floor. */}
      <div className="a-board">
        <section className="a-board__col">
          <div className="a-board__head">
            <h2 className="a-board__title">Awaiting review</h2>
            <Link href="/admin/submissions" className="t-btn t-btn--ghost t-btn--sm">
              See all
              <Icon name="chevronRight" size={15} />
            </Link>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="a-clear">
              <Icon name="check" size={18} />
              <p>
                <strong>The queue is clear.</strong> Anything a business sends
                in lands here.
              </p>
            </div>
          ) : (
            <div className="a-queue">
              {pendingSubmissions.slice(0, 6).map((s) => {
                const payload = s.payload as { name?: string } | null;
                return (
                  <Link
                    key={s.id}
                    href={`/admin/submissions/${s.id}`}
                    className="a-queue__item"
                  >
                    <span className="a-queue__icon">
                      <Icon name="mail" size={18} />
                    </span>
                    <span className="a-queue__body">
                      <span className="a-queue__name">
                        {s.kind === "create"
                          ? payload?.name ?? "A new listing"
                          : `Changes to ${s.placeId ?? "a listing"}`}
                      </span>
                      <span className="a-queue__meta">
                        {s.business.name} · {adminDate(s.createdAt)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="a-board__col">
          <div className="a-board__head">
            <h2 className="a-board__title">Recent activity</h2>
            <Link href="/admin/activity" className="t-btn t-btn--ghost t-btn--sm">
              See all
              <Icon name="chevronRight" size={15} />
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="a-clear">
              <Icon name="clock" size={18} />
              <p>Nothing changed yet. Every edit made here is recorded.</p>
            </div>
          ) : (
            <div className="a-queue">
              {activity.map((event) => (
                <div key={event.id} className="a-queue__item">
                  <span className="a-queue__icon">
                    <Icon name="refresh" size={17} />
                  </span>
                  <span className="a-queue__body">
                    <span className="a-queue__name">
                      {event.actor?.name ?? "A removed account"} · <code>{event.action}</code>
                    </span>
                    <span className="a-queue__meta">
                      {event.entityId} · {adminDate(event.createdAt)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* How big the catalogue is, and how fast submissions are arriving.
          The sparkline lives here because it is a fact about the catalogue —
          it used to be bolted to the bottom of the review queue, where an
          empty queue left it floating in white space. */}
      <section className="a-board__foot">
        <div className="a-board__head">
          <h2 className="a-board__title">The catalogue</h2>
          <span className="a-hint">Submissions per week, last eight</span>
        </div>

        <div className="a-summary">
          <CountStrip
            items={[
              { label: "places", value: places, icon: "pin", note: "listed", href: "/admin/places" },
              {
                label: "categories",
                value: categories,
                icon: "list",
                note: `${cities} districts`,
                href: "/admin/categories",
              },
              ...(admin
                ? [
                    {
                      label: "users",
                      value: users,
                      icon: "user" as const,
                      note: "accounts",
                      href: "/admin/users",
                    },
                    {
                      label: "businesses",
                      value: businesses.length,
                      icon: "basket" as const,
                      note: `${unverified} unverified`,
                      href: "/admin/businesses",
                    },
                  ]
                : []),
            ]}
          />
          <div className="a-summary__chart">
            <TrendChart values={weeklySubmissions} />
          </div>
        </div>
      </section>

    </>
  );
}
