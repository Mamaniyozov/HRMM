import React from "react";
import { cx } from "../lib/cx";
import "./Button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = filled accent, ghost = soft outline, icon = square icon-only button */
  variant?: "primary" | "ghost" | "icon";
  /** icon rendered before the label (primary/ghost) or as the sole content (icon) */
  icon?: React.ReactNode;
}

const CLASS_BY_VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "primary-btn",
  ghost: "ghost-btn",
  icon: "icon-btn",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", icon, className, children, ...rest }, ref) => {
    return (
      <button ref={ref} className={cx(CLASS_BY_VARIANT[variant], className)} {...rest}>
        {icon}
        {variant !== "icon" ? children : null}
      </button>
    );
  },
);

Button.displayName = "Button";
