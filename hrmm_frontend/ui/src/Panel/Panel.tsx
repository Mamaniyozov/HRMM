import React from "react";
import { cx } from "../lib/cx";
import "./Panel.css";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("panel", className)} {...rest} />
  ),
);
Panel.displayName = "Panel";

export interface PanelHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** lays the heading out with space-between (title left, actions right) */
  inline?: boolean;
}

export const PanelHeading = React.forwardRef<HTMLDivElement, PanelHeadingProps>(
  ({ inline, className, ...rest }, ref) => (
    <div ref={ref} className={cx("panel-heading", inline && "inline", className)} {...rest} />
  ),
);
PanelHeading.displayName = "PanelHeading";
