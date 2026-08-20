"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useTheme } from "@/lib/client/theme";

interface Stat {
  value: string;
  label: string;
}

interface Props {
  image: string;
  badge: string;
  title: string;
  description: string;
  stats: Stat[];
  /** Where "back" goes if there is no history to pop. */
  fallbackHref?: string;
}

/**
 * The image half of the login/register split. Carries its own floating
 * back + theme controls instead of the usual PageHeader — this screen is a
 * full-bleed photo, not a bar-plus-content layout, so a 56px opaque header
 * would just cut a slice off the top of it.
 */
export default function AuthHero({ image, badge, title, description, stats, fallbackHref = "/" }: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="t-auth-hero" style={{ backgroundImage: `url(${image})` }}>
      <div className="t-auth-hero__overlay" />

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

        <button
          type="button"
          className="t-iconbtn t-iconbtn--solid"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={toggleTheme}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
      </div>

      <div className="t-auth-hero__content">
        <div className="t-auth-hero__badge">
          <Icon name="pin" size={16} />
          <span>{badge}</span>
        </div>

        <h2 className="t-auth-hero__title">{title}</h2>
        <p className="t-auth-hero__desc">{description}</p>

        <div className="t-auth-hero__stats">
          {stats.map((s) => (
            <div key={s.label} className="t-auth-hero__stat">
              <span className="t-auth-hero__stat-val">{s.value}</span>
              <span className="t-auth-hero__stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
