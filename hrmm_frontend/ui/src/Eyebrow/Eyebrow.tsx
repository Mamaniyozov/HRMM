import React from "react";
import { cx } from "../lib/cx";
import "./Eyebrow.css";

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const Eyebrow = React.forwardRef<HTMLParagraphElement, EyebrowProps>(
  ({ className, ...rest }, ref) => <p ref={ref} className={cx("eyebrow", className)} {...rest} />,
);
Eyebrow.displayName = "Eyebrow";
