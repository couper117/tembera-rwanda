"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Pixel width of the panel. Clamped to stay inside the viewport. */
  width?: number;
  children: ReactNode;
}

interface Position {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const MARGIN = 8;
const GAP = 8;

/**
 * A lightweight dropdown anchored under a trigger element — no backdrop, no
 * scroll lock, just a positioned card. Portaled to <body> so a transformed
 * ancestor (a modal, an animated rail, ...) can't turn into its containing
 * block and mangle its position — that's what a `position: fixed` popover
 * nested inside a sheet or dialog would otherwise be at the mercy of.
 */
export default function Popover({ open, anchorRef, onClose, width = 320, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const reposition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      // Right-align to the trigger by default (it usually sits near the
      // right edge of the header), clamped so the panel never runs off
      // either side of the viewport.
      const left = Math.max(
        MARGIN,
        Math.min(rect.right - width, window.innerWidth - width - MARGIN),
      );
      const top = rect.bottom + GAP;
      const maxHeight = Math.max(180, window.innerHeight - top - MARGIN);
      setPosition({ top, left, width, maxHeight });
    };

    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    // Scrolling the page out from under the panel leaves it floating over
    // the wrong content — close it. Scrolling *inside* the panel (the city
    // list) shouldn't count, so ignore events that originate there.
    const onScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose, anchorRef]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="t-popover"
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
