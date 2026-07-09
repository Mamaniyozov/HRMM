import React from "react";
import { cx } from "../lib/cx";
import "./Form.css";

export interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** two-column layout, per .form-grid.two-col */
  twoCol?: boolean;
}

export const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ twoCol, className, ...rest }, ref) => (
    <div ref={ref} className={cx("form-grid", twoCol && "two-col", className)} {...rest} />
  ),
);
FormGrid.displayName = "FormGrid";

export interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/** Wraps the source `<label>{span}{control}</label>` pattern used throughout the prototype's forms. */
export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children, className }) => (
  <label htmlFor={htmlFor} className={className}>
    <span>{label}</span>
    {children}
  </label>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** no inner scrollbar, expands with content — per .auto-grow */
  autoGrow?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ autoGrow, className, ...rest }, ref) => (
    <textarea ref={ref} className={cx(autoGrow && "auto-grow", className)} {...rest} />
  ),
);
Textarea.displayName = "Textarea";

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("form-actions", className)} {...rest} />
  ),
);
FormActions.displayName = "FormActions";
