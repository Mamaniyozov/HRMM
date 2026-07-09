import React from "react";
import { cx } from "../lib/cx";
import "./EmptyState.css";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  message: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, message, className, ...rest }, ref) => (
    <div ref={ref} className={cx("empty-state", className)} {...rest}>
      <div className="empty-state-content">
        {icon ? <span className="empty-state-icon">{icon}</span> : null}
        <span>{message}</span>
      </div>
    </div>
  ),
);
EmptyState.displayName = "EmptyState";
