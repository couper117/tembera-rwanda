import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice, Stat } from "@/components/admin/ui";
import TrendChart from "@/components/admin/TrendChart";
import {
  BUSINESSES,
  SUBMISSIONS,
  SUBMISSION_TREND,
  adminDate,
} from "@/lib/admin/placeholder";
import { recentAudit } from "@/lib/audit";
import { getCategories } from "@/lib/data/categories";
import { getCities } from "@/lib/data/cities";
import { openReportCount } from "@/lib/data/moderation";
import { getAllPlaces } from "@/lib/data/places";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Everything here is real except submissions and businesses, which have no
  // table yet — the <SampleNotice> below names exactly those two rather than
  // casting doubt over the whole screen.
  const [catalog, taxonomy, cityList, users, openReports, activity] = await Promise.all([
    getAllPlaces(),
    getCategories(),
    getCities(),
    prisma.user.count(),
    openReportCount(),
    recentAudit({ take: 5 }),
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

  const pendingSubmissions = SUBMISSIONS.filter((s) => s.status === "pending");
  const unverified = BUSINESSES.filter((b) => b.status === "unverified").length;

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

      <SampleNotice what="Submissions and business accounts" />

      {/* Two rows, deliberately. The first is work waiting on somebody; the
          second is the size and health of the catalogue. Mixing them makes a
          number nobody can act on sit beside one that needs doing today. */}
      <h2 className="a-statsgroup">Needs attention</h2>
      <div className="a-stats">
        <Stat
          label="Open reports"
          value={openReports}
          icon="alert"
          note="problems visitors sent in"
          href="/admin/reports"
        />
        <Stat
          label="Submissions"
          value={pendingSubmissions.length}
          icon="mail"
          note="awaiting review"
          href="/admin/submissions"
        />
        <Stat
          label="Drafts"
          value={drafts}
          icon="pin"
          note="not published yet"
          href="/admin/places?status=draft"
        />
        <Stat
          label="Missing a photo"
          value={missingPhoto}
          icon="image"
          note="of the whole catalogue"
          href="/admin/places?gap=no-photo"
        />
      </div>

      <h2 className="a-statsgroup">The catalogue</h2>
      <div className="a-stats">
        <Stat label="Places" value={places} icon="pin" note="listed" href="/admin/places" />
        <Stat
          label="Categories"
          value={categories}
          icon="list"
          note={`${cities} districts`}
          href="/admin/categories"
        />
        {admin && (
          <Stat label="Users" value={users} icon="user" note="accounts" href="/admin/users" />
        )}
        {admin && (
          <Stat
            label="Businesses"
            value={BUSINESSES.length}
            icon="basket"
            note={`${unverified} unverified`}
            href="/admin/businesses"
          />
        )}
      </div>

      <div className="a-cols">
        <div>
          <Panel
            title="Awaiting review"
            action={
              <Link href="/admin/submissions" className="t-btn t-btn--ghost t-btn--sm">
                See all
                <Icon name="chevronRight" size={15} />
              </Link>
            }
            flush
          >
            {pendingSubmissions.length === 0 ? (
              <p className="a-empty">Nothing waiting. The queue is clear.</p>
            ) : (
              <div className="a-queue">
                {pendingSubmissions.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/admin/submissions/${s.id}`} className="a-queue__item">
                    <span className="a-queue__icon">
                      <Icon name="mail" size={18} />
                    </span>
                    <span className="a-queue__body">
                      <span className="a-queue__name">{s.placeName}</span>
                      <span className="a-queue__meta">
                        {s.businessName} · {s.subcategory} · {s.city} ·{" "}
                        {adminDate(s.submittedAt)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

        </div>

        <div>
          <Panel title="Submissions per week">
            <TrendChart values={SUBMISSION_TREND} />
            <p className="a-hint" style={{ marginTop: "var(--t-2)" }}>
              Sample series — the last eight weeks.
            </p>
          </Panel>

          <Panel
            title="Recent activity"
            action={
              <Link href="/admin/activity" className="t-btn t-btn--ghost t-btn--sm">
                See all
                <Icon name="chevronRight" size={15} />
              </Link>
            }
            flush
          >
            {activity.length === 0 ? (
              <p className="a-empty">
                Nothing changed yet. Every edit made here is recorded.
              </p>
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
          </Panel>
        </div>
      </div>
    </>
  );
}
