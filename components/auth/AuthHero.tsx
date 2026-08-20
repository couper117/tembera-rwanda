"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

interface Stat {
  value: string;
  label: string;
}

interface Props {
  image: string;
  /** Omit all four to render a clean, unlabelled photo — no overlay, no
   *  gradient, just the back button. */
  badge?: string;
  title?: string;
  description?: string;
  stats?: Stat[];
  /** Where "back" goes if there is no history to pop. */
  fallbackHref?: string;
  /** Small corner attribution for a licensed photo (e.g. Creative Commons —
   *  required by the license, not marketing copy, so it stays tiny and out
   *  of the way regardless of whether badge/title/etc are set). */
  credit?: string;
}

/**
 * The image half of the login/register split. Carries its own floating back
 * button instead of the usual PageHeader — this screen is a full-bleed
 * photo, not a bar-plus-content layout, so a 56px opaque header would just
 * cut a slice off the top of it.
 */
export default function AuthHero({
  image,
  badge,
  title,
  description,
  stats,
  fallbackHref = "/",
  credit,
}: Props) {
  const router = useRouter();
  const hasContent = Boolean(title);

  return (
    <div className="t-auth-hero" style={{ backgroundImage: `url(${image})` }}>
      {hasContent && <div className="t-auth-hero__overlay" />}

      <div className="t-auth-floaters">
        <button
          type="button"
          className="t-iconbtn t-iconbtn--solid"
          aria-label="Go back"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push(fallbackHref);
          }}
        >
          <Icon name="arrowLeft" size={20} />
        </button>
      </div>

      {hasContent && (
        <div className="t-auth-hero__content">
          {badge && (
            <div className="t-auth-hero__badge">
              <Icon name="pin" size={16} />
              <span>{badge}</span>
            </div>
          )}

          <h2 className="t-auth-hero__title">{title}</h2>
          {description && <p className="t-auth-hero__desc">{description}</p>}

          {stats && stats.length > 0 && (
            <div className="t-auth-hero__stats">
              {stats.map((s) => (
                <div key={s.label} className="t-auth-hero__stat">
                  <span className="t-auth-hero__stat-val">{s.value}</span>
                  <span className="t-auth-hero__stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {credit && <span className="t-auth-hero__credit">{credit}</span>}
    </div>
  );
}
