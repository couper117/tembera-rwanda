import { PageHead, Panel, SampleNotice, StatusBadge } from "@/components/admin/ui";
import { BOOKINGS, adminDate } from "@/lib/admin/placeholder";
import { updateBookingStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = BOOKINGS;
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <>
      <SampleNotice what="Bookings" />

      <PageHead
        title="Bookings"
        sub={`${bookings.length} request${bookings.length === 1 ? "" : "s"}, ${pending} still pending.`}
      />

      <Panel title="All bookings" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Experience</th>
                <th>Guest</th>
                <th>Preferred</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Placed</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <p className="a-empty">No bookings yet.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td className="a-table__strong">{b.experience}</td>
                    <td>
                      {b.fullName}
                      <span className="a-table__sub">{b.email}</span>
                    </td>
                    <td>{adminDate(b.preferredAt)}</td>
                    <td>{b.guests}</td>
                    <td>${b.totalPrice.toLocaleString()}</td>
                    <td>{adminDate(b.createdAt)}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <form action={updateBookingStatus} className="a-table__actions">
                        <input type="hidden" name="id" value={b.id} />
                        <select
                          name="status"
                          defaultValue={b.status}
                          className="a-select"
                          style={{ width: "auto" }}
                          aria-label={`Status for booking ${b.id}`}
                        >
                          <option value="pending">pending</option>
                          <option value="confirmed">confirmed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <button type="submit" className="t-btn t-btn--secondary t-btn--sm">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
