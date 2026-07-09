import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Aurora Precision/Button",
  component: Button,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Button>;

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const Primary: Story = {
  args: { variant: "primary", children: "Save changes" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancel" },
};

export const Icon: Story = {
  args: { variant: "icon", icon: <StarIcon />, "aria-label": "Favorite" },
};

export const Disabled: Story = {
  args: { variant: "primary", children: "Save changes", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="icon" icon={<StarIcon />} aria-label="Favorite" />
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  ),
};
