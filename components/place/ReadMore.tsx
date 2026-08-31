"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

/**
 * A long description, clamped until the reader asks for the rest.
 *
 * Descriptions in the catalogue run from one line to twelve, and the long ones
 * pushed the opening hours and the map a full screen down — the reader pays
 * for a paragraph they did not ask to read. Clamping fixes that without
 * hiding anything: the text is all in the DOM, so it is still searchable,
 * still selectable and still read out in full by a screen reader.
 *
 * The toggle only appears when the text is actually cut off. Measuring is the
 * only honest way to know that: a four-line description at 390px is two lines
 * at 1280px, and a hardcoded character count would be wrong at one width or
 * the other. Re-measured on resize for the same reason.
 */
export default function ReadMore({
  children,
  lines = 6,
}: {
  children: React.ReactNode;
  /** How many lines to show before cutting. */
  lines?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      // scrollHeight is the full text; clientHeight is what the clamp lets
      // through. The tolerance absorbs sub-pixel line heights, which would
      // otherwise show a "Read more" that reveals nothing.
      setClipped(el.scrollHeight - el.clientHeight > 4);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  return (
    <>
      <p
        ref={ref}
        className="t-body t-readmore"
        style={
          open
            ? undefined
            : { WebkitLineClamp: lines, ["--t-readmore-lines" as string]: String(lines) }
        }
        data-open={open ? "" : undefined}
      >
        {children}
      </p>

      {/* Once open the button stays, so the reader can put it back. */}
      {(clipped || open) && (
        <button
          type="button"
          className="t-readmore__toggle"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
        >
          {open ? "Show less" : "Read more"}
          {/* One chevron, flipped — an "up" glyph would be the same path
              drawn twice in the icon set. */}
          <Icon name="chevronDown" size={15} />
        </button>
      )}
    </>
  );
}
