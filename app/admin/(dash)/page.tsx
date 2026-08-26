import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, Stat, StatusBadge } from "@/components/admin/ui";
import TrendChart from "@/components/admin/TrendChart";
import {
  ACTIVITY,
  BUSINESSES,
  SUBMISSIONS,
  SUBMISSION_TREND,
  adminDate,
} from "@/lib/admin/placeholder";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [places, categories, cities, users, pendingBookings, recentBookings] =
    await Promise.all([
      prisma.place.count(),
      prisma.category.count(),
      prisma.city.count(),
      prisma.user.count(),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);

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

      <div className="a-stats">
        <Stat
          label="Submissions"
          value={pendingSubmissions.length}
          icon="mail"
          note="awaiting review"
          href="/admin/submissions"
        />
        <Stat
          label="Bookings"
          value={pendingBookings}
          icon="ticket"
          note="pending"
          href="/admin/bookings"
        />
        <Stat
          label="Businesses"
          value={BUSINESSES.length}
          icon="basket"
          note={`${unverified} unverified`}
          href="/admin/businesses"
        />
        <Stat label="Places" value={places} icon="pin" note="published" href="/admin/places" />
        <Stat
          label="Categories"
          value={categories}
          icon="list"
          note={`${cities} cities`}
          href="/admin/categories"
        />
        <Stat label="Users" value={users} icon="user" note="accounts" href="/admin/users" />
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

          <Panel title="Recent bookings" flush>
            <div className="a-tablewrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Experience</th>
                    <th>Guest</th>
                    <th>Preferred</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="a-empty">No bookings yet.</p>
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="a-table__strong">{b.experience}</td>
                        <td>
                          {b.fullName}
                          <span className="a-table__sub">{b.email}</span>
                        </td>
                        <td>{adminDate(b.preferredAt)}</td>
                        <td>${b.totalPrice.toLocaleString()}</td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Submissions per week">
            <TrendChart values={SUBMISSION_TREND} />
            <p className="a-hint" style={{ marginTop: "var(--t-2)" }}>
              Sample series — the last eight weeks.
            </p>
          </Panel>

          <Panel title="Recent activity" flush>
            <div className="a-queue">
              {ACTIVITY.slice(0, 5).map((entry) => (
                <div key={entry.id} className="a-queue__item">
                  <span className="a-queue__icon">
                    <Icon
                      name={
                        entry.kind === "approve"
                          ? "check"
                          : entry.kind === "reject"
                            ? "close"
                            : entry.kind === "signin"
                              ? "lock"
                              : "refresh"
                      }
                      size={17}
                    />
                  </span>
                  <span className="a-queue__body">
                    <span className="a-queue__name">
                      {entry.actor} {entry.action}
                    </span>
                    <span className="a-queue__meta">
                      {entry.target} · {adminDate(entry.at)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
