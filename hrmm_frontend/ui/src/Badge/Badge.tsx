import React from "react";
import { cx } from "../lib/cx";
import "./Badge.css";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "pending" | "approved" | "rejected" | "neutral";
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, className, children, ...rest }, ref) => (
    <span ref={ref} className={cx("status-pill", `status-pill--${status}`, className)} {...rest}>
      {children}
    </span>
  ),
);
StatusPill.displayName = "StatusPill";
