import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice } from "@/components/admin/ui";
import { ACTIVITY, adminDate } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

const GLYPH = {
  approve: "check",
  reject: "close",
  create: "plus",
  update: "refresh",
  delete: "broom",
  signin: "lock",
} as const;

export default async function ActivityPage() {
  return (
    <>
      <PageHead
        title="Activity"
        sub="Who changed what, and when. An audit trail for a system the government has to answer for."
      />

      <SampleNotice what="The audit trail" />

      <Panel title="Recent actions" flush>
        <div className="a-queue">
          {ACTIVITY.map((entry) => (
            <div key={entry.id} className="a-queue__item">
              <span className="a-queue__icon">
                <Icon name={GLYPH[entry.kind]} size={17} />
              </span>
              <span className="a-queue__body">
                <span className="a-queue__name">
                  {entry.actor} {entry.action} <strong>{entry.target}</strong>
                </span>
                <span className="a-queue__meta">{adminDate(entry.at)}</span>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
