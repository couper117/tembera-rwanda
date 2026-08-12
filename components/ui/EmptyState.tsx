import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

export interface StateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

interface Props {
  icon?: IconName;
  title: string;
  text?: string;
  actions?: StateAction[];
}

/**
 * The single component behind every empty, error and not-yet state. Each one
 * says what happened and offers a way forward — never a bare "no results".
 */
export default function EmptyState({ icon = "search", title, text, actions }: Props) {
  return (
    <div className="t-state">
      <span className="t-state__icon">
        <Icon name={icon} size={24} />
      </span>
      <h2 className="t-state__title">{title}</h2>
      {text && <p className="t-state__text">{text}</p>}

      {actions && actions.length > 0 && (
        <div className="t-state__actions">
          {actions.map((action) => {
            const className = `t-btn t-btn--sm t-btn--${action.variant ?? "secondary"}`;
            return action.href ? (
              <Link key={action.label} href={action.href} className={className}>
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={className}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
