"use client";

import Icon, { type IconName } from "@/components/Icon";

/**
 * The category rail inside Settings.
 *
 * Settings used to be one 760px column of six stacked cards, which meant
 * finding "clear my search history" was a scroll and a scan. A rail turns it
 * into a choice: pick the area, read the two switches in it. It is also what
 * lets the page use the width it has instead of leaving two thirds of a
 * desktop screen empty.
 *
 * State rather than routes on purpose — these are panes of one screen, not six
 * destinations, and a URL per switch is a browser history nobody wants.
 */

export interface SettingsSection {
  id: string;
  label: string;
  icon: IconName;
  note: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "account", label: "Account", icon: "user", note: "Who you are signed in as" },
  { id: "appearance", label: "Appearance", icon: "sun", note: "Light and dark" },
  { id: "region", label: "Language & region", icon: "map", note: "Language, currency, distance" },
  { id: "location", label: "Location", icon: "pin", note: "Where distances start from" },
  { id: "notifications", label: "Notifications", icon: "bell", note: "What we email you" },
  { id: "privacy", label: "Privacy & data", icon: "lock", note: "Your data, and removing it" },
  { id: "about", label: "About", icon: "info", note: "Tembera, terms and privacy" },
];

export default function SettingsNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="t-setnav" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`t-setnav__item${active === section.id ? " t-setnav__item--on" : ""}`}
          aria-current={active === section.id ? "page" : undefined}
          onClick={() => onSelect(section.id)}
        >
          <span className="t-setnav__icon">
            <Icon name={section.icon} size={17} />
          </span>
          <span className="t-setnav__body">
            <span className="t-setnav__label">{section.label}</span>
            <span className="t-setnav__note">{section.note}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
