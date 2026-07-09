import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Panel, PanelHeading } from "./Panel";
import { Button } from "../Button";

const meta: Meta<typeof Panel> = {
  title: "Aurora Precision/Panel",
  component: Panel,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  render: () => (
    <Panel style={{ maxWidth: 420 }}>
      <PanelHeading>
        <h3 style={{ margin: 0 }}>Panel title</h3>
      </PanelHeading>
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
        Panel content goes here — glass surface on the aurora background.
      </p>
    </Panel>
  ),
};

export const WithInlineHeadingActions: Story = {
  render: () => (
    <Panel style={{ maxWidth: 420 }}>
      <PanelHeading inline>
        <h3 style={{ margin: 0 }}>Recent activity</h3>
        <Button variant="ghost">View all</Button>
      </PanelHeading>
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
        Inline heading pairs a title with a right-aligned action.
      </p>
    </Panel>
  ),
};
