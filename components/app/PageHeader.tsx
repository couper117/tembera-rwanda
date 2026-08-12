"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import { useScrolled } from "./AppHeader";

interface Props {
  title: string;
  /** Where "back" goes if there is no history to pop. */
  fallbackHref?: string;
  /** Keep the title hidden until scrolled — used when the page has its own H1. */
  revealTitleOnScroll?: boolean;
  actions?: ReactNode;
}

/** App bar for sub-screens: back, title, optional actions. */
export default function PageHeader({
  title,
  fallbackHref = "/",
  revealTitleOnScroll = false,
  actions,
}: Props) {
  const router = useRouter();
  const scrolled = useScrolled(24);
  const showTitle = revealTitleOnScroll ? scrolled : true;

  return (
    <header className={`t-header${scrolled ? " t-header--bordered" : ""}`}>
      <button
        type="button"
        className="t-iconbtn"
        aria-label="Go back"
        onClick={() => {
          // history.length is 1 on a cold load (shared link, refresh).
          if (window.history.length > 1) router.back();
          else router.push(fallbackHref);
        }}
      >
        <Icon name="arrowLeft" size={21} />
      </button>

      <h1
        className="t-heading t-truncate"
        style={{
          flex: 1,
          minWidth: 0,
          opacity: showTitle ? 1 : 0,
          transition: "opacity var(--t-base) var(--t-ease)",
        }}
      >
        {title}
      </h1>

      {actions && <div className="t-header__actions">{actions}</div>}
    </header>
  );
}
