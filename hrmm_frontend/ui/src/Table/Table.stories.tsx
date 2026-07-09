import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Table } from "./Table";
import { StatusPill } from "../Badge";

const meta: Meta = {
  title: "Aurora Precision/Table",
  tags: ["autodocs"],
};
export default meta;

interface Row {
  id: number;
  name: string;
  department: string;
  status: "pending" | "approved" | "rejected";
}

const rows: Row[] = [
  { id: 1, name: "Jane Doe", department: "Engineering", status: "approved" },
  { id: 2, name: "John Smith", department: "Design", status: "pending" },
  { id: 3, name: "Amy Lee", department: "HR", status: "rejected" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={{ width: 480 }}>
      <Table<Row>
        rowKey={(r) => r.id}
        rows={rows}
        columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "department", header: "Department", render: (r) => r.department },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusPill status={r.status}>{r.status}</StatusPill>,
          },
        ]}
      />
    </div>
  ),
};
