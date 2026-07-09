import React from "react";
import { cx } from "../lib/cx";
import "./Card.css";
import "../Panel/Panel.css";

/**
 * Generic content card. No standalone `.card` class exists in the source
 * prototype, so this reuses the verified `.panel` surface (same material:
 * padding, radius-xl, panel background, shadow-md) for a lighter-weight API
 * than importing Panel directly.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("panel", className)} {...rest} />
  ),
);
Card.displayName = "Card";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** drives --card-accent (icon tint + number color); any CSS color, e.g. "var(--accent)" */
  accentColor?: string;
  links?: Array<{ label: string; onClick?: () => void; active?: boolean }>;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, accentColor = "var(--accent)", links, className, style, ...rest }, ref) => {
    return (
      <article
        ref={ref}
        className={cx("stat-card", className)}
        style={{ ["--card-accent" as string]: accentColor, ...style }}
        {...rest}
      >
        <div className="stat-card-head">
          <span className="stat-card-label">{label}</span>
          {icon ? <span className="stat-card-icon">{icon}</span> : null}
        </div>
        <div className="stat-card-number">{value}</div>
        {links && links.length > 0 ? (
          <div className="stat-card-links">
            {links.map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 ? <span className="stat-card-link-sep">·</span> : null}
                <button
                  type="button"
                  className={cx("stat-card-link", link.active && "active")}
                  onClick={link.onClick}
                >
                  {link.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </article>
    );
  },
);
StatCard.displayName = "StatCard";
