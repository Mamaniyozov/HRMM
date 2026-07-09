import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Card, StatCard } from "./Card";

const meta: Meta = {
  title: "Aurora Precision/Card",
  tags: ["autodocs"],
};
export default meta;

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

export const GenericCard: StoryObj = {
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <p style={{ margin: 0 }}>A generic content card (reuses the panel surface).</p>
    </Card>
  ),
};

export const StatCardDefault: StoryObj = {
  render: () => (
    <div style={{ width: 260 }}>
      <StatCard label="Active Employees" value={128} icon={<UsersIcon />} />
    </div>
  ),
};

export const StatCardWithLinks: StoryObj = {
  render: () => (
    <div style={{ width: 260 }}>
      <StatCard
        label="Pending Requests"
        value={12}
        icon={<UsersIcon />}
        accentColor="var(--warning)"
        links={[
          { label: "All", active: true },
          { label: "Leave" },
          { label: "Reports" },
        ]}
      />
    </div>
  ),
};

export const StatCardGrid: StoryObj = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: 720 }}>
      <StatCard label="Active Employees" value={128} icon={<UsersIcon />} />
      <StatCard label="On Leave" value={6} icon={<UsersIcon />} accentColor="var(--success)" />
      <StatCard label="Pending" value={12} icon={<UsersIcon />} accentColor="var(--warning)" />
    </div>
  ),
};
