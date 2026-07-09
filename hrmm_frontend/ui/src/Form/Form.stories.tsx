import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FormGrid, FormField, Input, Textarea, FormActions } from "./Form";
import { Button } from "../Button";

const meta: Meta = {
  title: "Aurora Precision/Form",
  tags: ["autodocs"],
};
export default meta;

export const SingleColumn: StoryObj = {
  render: () => (
    <FormGrid style={{ maxWidth: 360 }}>
      <FormField label="Full name">
        <Input placeholder="Jane Doe" />
      </FormField>
      <FormField label="Notes">
        <Textarea autoGrow placeholder="Add a note..." />
      </FormField>
      <FormActions>
        <Button variant="primary">Save</Button>
        <Button variant="ghost">Cancel</Button>
      </FormActions>
    </FormGrid>
  ),
};

export const TwoColumn: StoryObj = {
  render: () => (
    <FormGrid twoCol style={{ maxWidth: 520 }}>
      <FormField label="First name">
        <Input placeholder="Jane" />
      </FormField>
      <FormField label="Last name">
        <Input placeholder="Doe" />
      </FormField>
      <FormField label="Department">
        <select>
          <option>Engineering</option>
          <option>Design</option>
          <option>HR</option>
        </select>
      </FormField>
      <FormField label="Start date">
        <Input type="date" />
      </FormField>
    </FormGrid>
  ),
};
