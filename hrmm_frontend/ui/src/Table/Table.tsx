import React from "react";
import { cx } from "../lib/cx";
import "./Table.css";

export interface TableWrapProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Horizontal-scroll wrapper — wrap any <table> in this, per .table-wrap. */
export const TableWrap = React.forwardRef<HTMLDivElement, TableWrapProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("table-wrap", className)} {...rest} />
  ),
);
TableWrap.displayName = "TableWrap";

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  className?: string;
}

/** Thin typed wrapper over the source's bare <table>/<th>/<td> element styling. */
export function Table<T>({ columns, rows, rowKey, className }: TableProps<T>) {
  return (
    <TableWrap>
      <table className={className}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
