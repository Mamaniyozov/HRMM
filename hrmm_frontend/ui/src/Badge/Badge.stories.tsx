import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { StatusPill } from "./Badge";

const meta: Meta<typeof StatusPill> = {
  title: "Aurora Precision/StatusPill",
  component: StatusPill,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof StatusPill>;

export const Pending: Story = { args: { status: "pending", children: "Pending" } };
export const Approved: Story = { args: { status: "approved", children: "Approved" } };
export const Rejected: Story = { args: { status: "rejected", children: "Rejected" } };
export const Neutral: Story = { args: { status: "neutral", children: "Draft" } };

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <StatusPill status="pending">Pending</StatusPill>
      <StatusPill status="approved">Approved</StatusPill>
      <StatusPill status="rejected">Rejected</StatusPill>
      <StatusPill status="neutral">Draft</StatusPill>
    </div>
  ),
};
