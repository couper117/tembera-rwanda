"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Icon from "@/components/Icon";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet on mobile, centred dialog on desktop (see components.css).
 * Handles the things a modal has to get right: Escape, background scroll lock,
 * focus moving in, and focus returning to whatever opened it.
 */
export default function BottomSheet({ open, title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="t-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="t-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="t-sheet__grab" aria-hidden="true" />
        <div className="t-sheet__head">
          <h2 className="t-heading">{title}</h2>
          <span className="t-spacer" />
          <button type="button" className="t-iconbtn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="t-sheet__body">{children}</div>
      </div>
    </>
  );
}
