import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Eyebrow } from "./Eyebrow";

const meta: Meta<typeof Eyebrow> = {
  title: "Aurora Precision/Eyebrow",
  component: Eyebrow,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = {
  render: () => (
    <div>
      <Eyebrow>Workspace</Eyebrow>
      <h2 style={{ margin: 0 }}>Dashboard</h2>
    </div>
  ),
};
