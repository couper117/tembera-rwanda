import Icon from "@/components/Icon";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { PageHead, Panel, SampleNotice } from "@/components/admin/ui";
import { CURRENT_ADMIN, USERS, adminDate } from "@/lib/admin/placeholder";
import { setUserRole, deleteUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // The page compares each row against the signed-in admin so nobody can
  // demote or delete themselves. With no session store there is no real
  // signed-in admin, so the sample one stands in and the guards still render.
  const admin = CURRENT_ADMIN;
  const users = USERS;

  const admins = users.filter((u) => u.role === "ADMIN").length;

  return (
    <>
      <SampleNotice what="User accounts" />

      <PageHead
        title="Users"
        sub={`${users.length} account${users.length === 1 ? "" : "s"}, ${admins} with admin access.`}
      />

      {error && (
        <div className="t-notice t-notice--danger" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="t-notice__body">{error}</div>
        </div>
      )}

      <Panel title="All accounts" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Handle</th>
                <th>Role</th>
                <th>Saves</th>
                <th>Visits</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <p className="a-empty">No users yet.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === admin.id;
                  const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN";
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="a-table__strong">{u.name}</span>
                        {isSelf && <span className="a-table__sub">that&apos;s you</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>@{u.handle}</td>
                      <td>
                        <span
                          className={`a-badge${u.role === "ADMIN" ? " a-badge--good" : ""}`}
                        >
                          {u.role === "ADMIN" ? "admin" : "user"}
                        </span>
                      </td>
                      <td>{u._count.saves}</td>
                      <td>{u._count.visits}</td>
                      <td>{adminDate(u.createdAt)}</td>
                      <td>
                        <div className="a-table__actions">
                          <form action={setUserRole}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="role" value={nextRole} />
                            <button
                              type="submit"
                              className="t-btn t-btn--secondary t-btn--sm"
                              disabled={isSelf && nextRole === "USER"}
                            >
                              {u.role === "ADMIN" ? "Demote" : "Promote"}
                            </button>
                          </form>
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <ConfirmButton
                              question={`Delete ${u.name}?`}
                              disabled={isSelf}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
