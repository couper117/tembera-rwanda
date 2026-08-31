import { EmptyRow, PageHead, Panel } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import InviteMemberForm from "@/components/business/InviteMemberForm";
import { adminDate } from "@/lib/admin/placeholder";
import { removeMemberAction } from "@/lib/actions/business";
import { requireBusiness } from "@/lib/auth";
import { getMembers, getMyBusiness } from "@/lib/data/business";

export const dynamic = "force-dynamic";

export default async function BusinessStaffPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const members = await getMembers(business.id);

  return (
    <>
      <PageHead
        title="Team"
        sub="Everyone who can manage this business on Tembera. Each person signs in as themselves."
      />

      {business.owner && (
        <Panel title="Add a colleague">
          <InviteMemberForm />
        </Panel>
      )}

      <Panel title="People" flush>
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Added</th>
                {business.owner && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <EmptyRow colSpan={business.owner ? 5 : 4}>Nobody yet.</EmptyRow>
              ) : (
                members.map((m) => {
                  const isSelf = m.user.id === user.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className="a-table__strong">{m.user.name}</span>
                        {isSelf && <span className="a-table__sub">that&apos;s you</span>}
                      </td>
                      <td>{m.user.email}</td>
                      <td>
                        <span className={`a-badge${m.owner ? " a-badge--good" : ""}`}>
                          {m.owner ? "owner" : "member"}
                        </span>
                      </td>
                      <td>{adminDate(m.createdAt)}</td>
                      {business.owner && (
                        <td>
                          <div
                            className="a-table__actions"
                            style={{ justifyContent: "flex-end" }}
                          >
                            {/* The owner cannot be removed — including by
                                themselves. Otherwise a business can be left
                                with listings nobody is able to manage. */}
                            {!m.owner && (
                              <form action={removeMemberAction}>
                                <input type="hidden" name="memberId" value={m.id} />
                                <ConfirmButton
                                  label="Remove"
                                  question={`Remove ${m.user.name}?`}
                                />
                              </form>
                            )}
                          </div>
                        </td>
                      )}
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
