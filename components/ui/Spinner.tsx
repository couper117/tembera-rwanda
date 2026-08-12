/**
 * The circular indeterminate indicator people know from mobile apps, drawn in
 * Tembera's accent green over a faint track.
 *
 * Two animations combine: the whole ring rotates at a constant rate while the
 * arc's dash grows and shrinks, which is what gives it the familiar easing
 * instead of a flat spin.
 *
 * Scope: this is for waits with **no content shape yet** — a third-party SDK
 * booting, a form submitting, a location lookup. Anything that resolves into a
 * list or grid of places uses the skeletons in ./Skeleton.tsx instead, because
 * a placeholder shaped like the result is the better signal.
 */
interface Props {
  size?: number;
  /** Announced to screen readers; also the tooltip. */
  label?: string;
  /**
   * "accent" is the standalone green ring. "current" inherits the surrounding
   * text colour, for use inside a filled button where green would vanish.
   */
  tone?: "accent" | "current";
  className?: string;
}

export default function Spinner({
  size = 28,
  label = "Loading",
  tone = "accent",
  className,
}: Props) {
  return (
    <span
      className={[
        "t-spinnerwrap",
        tone === "current" ? "t-spinner--current" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <svg
        className="t-spinner"
        width={size}
        height={size}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle className="t-spinner__track" cx="25" cy="25" r="20" />
        <circle className="t-spinner__arc" cx="25" cy="25" r="20" />
      </svg>
      <span className="t-sr">{label}</span>
    </span>
  );
}

/**
 * Spinner plus a line of text, centred in whatever space it's given. Use this
 * for waits where there is no content shape to stand in for yet.
 */
export function LoadingState({
  message = "Loading…",
  size = 30,
  minHeight = 220,
}: {
  message?: string;
  size?: number;
  /** Any CSS length — a number is treated as pixels. */
  minHeight?: number | string;
}) {
  return (
    <div className="t-loading" style={{ minHeight }}>
      <Spinner size={size} label={message} />
      <p className="t-loading__text">{message}</p>
    </div>
  );
}
