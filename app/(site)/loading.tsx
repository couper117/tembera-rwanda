import { SkeletonGrid } from "@/components/ui/Skeleton";

/** Shown while a screen's server data resolves. Shaped like the content. */
export default function Loading() {
  return (
    <main className="t-main">
      <div className="t-page">
        <div className="t-section">
          <div className="t-skel t-skel--line" style={{ width: 200, height: 28 }} />
          <div className="t-skel t-skel--line" style={{ width: 130, marginTop: 10 }} />
        </div>
        <div style={{ marginTop: "var(--t-6)" }}>
          <SkeletonGrid count={6} />
        </div>
      </div>
    </main>
  );
}
