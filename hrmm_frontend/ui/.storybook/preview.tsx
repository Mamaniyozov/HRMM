import type { Preview, Decorator } from "@storybook/react";
import React, { useEffect, useRef } from "react";
import "../src/styles/index.css";
import { THEME_PRESETS, applyTheme } from "../src/styles/themes";

const withTheme: Decorator = (Story, context) => {
  const ref = useRef<HTMLDivElement>(null);
  const presetId = (context.globals.theme as string) || "classic-light";

  useEffect(() => {
    if (ref.current) applyTheme(ref.current, presetId);
  }, [presetId]);

  return (
    <div ref={ref} style={{ padding: 24, background: "var(--bg)", minHeight: "100vh" }}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    theme: {
      description: "Aurora Precision theme preset",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEME_PRESETS.map((t) => ({ value: t.id, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "classic-light",
  },
  decorators: [withTheme],
};

export default preview;
