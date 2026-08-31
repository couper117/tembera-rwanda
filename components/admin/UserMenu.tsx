"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

/**
 * The account control in the top bar.
 *
 * Replaces a plain block of text next to an unlabelled padlock. Two things
 * were wrong with that: a padlock does not read as "sign out" to anyone who
 * has not been told, and an email address is not an identity — it is a
 * detail you want when you check, not something to stare at all day.
 *
 * So: initials, name and role in the bar; the address and the destructive
 * action behind a deliberate click.
 */

/** "Jean-Paul Nsengimana" → "JN". Falls back to the address if there is no name. */
function initialsOf(name: string, email: string): string {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
  BUSINESS: "Business",
  USER: "Visitor",
};

export default function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  // Close on an outside click or Escape. Without both, a menu opened by
  // accident has to be dismissed by clicking the exact control again, which
  // people do not discover.
  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="a-usermenu" ref={wrap}>
      <button
        type="button"
        className="a-usermenu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="a-avatar" aria-hidden="true">
          {initialsOf(name, email)}
        </span>
        <span className="a-usermenu__who t-show-desktop">
          <span className="a-usermenu__name">{name || email}</span>
          <span className="a-usermenu__role">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <Icon name="chevronDown" size={15} />
      </button>

      {open && (
        <div className="a-menu" role="menu">
          <div className="a-menu__head">
            <span className="a-avatar a-avatar--lg" aria-hidden="true">
              {initialsOf(name, email)}
            </span>
            <span className="a-menu__id">
              <span className="a-menu__name">{name || "Unnamed account"}</span>
              <span className="a-menu__mail">{email}</span>
              <span className="a-badge a-badge--good">{ROLE_LABEL[role] ?? role}</span>
            </span>
          </div>

          <Link href="/profile" className="a-menu__item" role="menuitem">
            <Icon name="user" size={16} />
            Your profile
          </Link>
          <Link href="/" className="a-menu__item" role="menuitem">
            <Icon name="external" size={16} />
            View the public site
          </Link>

          <form action="/logout" method="post" className="a-menu__foot">
            <input type="hidden" name="redirectTo" value="/" />
            <button type="submit" className="a-menu__item a-menu__item--danger" role="menuitem">
              <Icon name="lock" size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
