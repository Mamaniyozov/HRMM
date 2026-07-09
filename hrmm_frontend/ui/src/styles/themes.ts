/* Aurora Precision named theme presets — ported from hrmm_frontend/themes.js.
   The base data-theme="light|dark" tokens (tokens.css) render every component
   correctly on their own; presets are additive runtime overrides applied by
   setting CSS variables on a root element (mirrors the prototype's applyTheme). */

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  iconBtnSize: string;
  background: string;
  backgroundDeep: string;
  backgroundElevated: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  badge: string;
  tokens: ThemeTokens;
}

const shared = {
  radiusSm: "6px",
  radiusMd: "8px",
  radiusLg: "12px",
  radiusXl: "16px",
  iconBtnSize: "36px",
} as const;

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic-light",
    name: "Classic Light",
    description: "Crisp light workspace with dark text and verified contrast.",
    mode: "light",
    badge: "",
    tokens: {
      ...shared,
      background: "#f8fafc",
      backgroundDeep: "#eef2f7",
      backgroundElevated: "#ffffff",
      surface: "#ffffff",
      surfaceElevated: "#ffffff",
      border: "#d6dee8",
      borderStrong: "#aab8c8",
      textPrimary: "#0f172a",
      textSecondary: "#334155",
      textMuted: "#5f6f85",
      accent: "#1f6feb",
      accentHover: "#185abc",
      accentSoft: "#dbeafe",
      success: "#087f5b",
      warning: "#9a6700",
      danger: "#cf222e",
    },
  },
  {
    id: "classic-dark",
    name: "Classic Dark",
    description: "GitHub-inspired dark canvas with high-clarity text.",
    mode: "dark",
    badge: "",
    tokens: {
      ...shared,
      background: "#0d1117",
      backgroundDeep: "#010409",
      backgroundElevated: "#161b22",
      surface: "#161b22",
      surfaceElevated: "#21262d",
      border: "#30363d",
      borderStrong: "#8b949e",
      textPrimary: "#f0f6fc",
      textSecondary: "#c9d1d9",
      textMuted: "#8b949e",
      accent: "#58a6ff",
      accentHover: "#79c0ff",
      accentSoft: "rgba(88, 166, 255, 0.18)",
      success: "#3fb950",
      warning: "#d29922",
      danger: "#f85149",
    },
  },
  {
    id: "soft-dark",
    name: "Soft Dark",
    description: "Lower-glare dark theme for long review sessions.",
    mode: "dark",
    badge: "New",
    tokens: {
      ...shared,
      background: "#171923",
      backgroundDeep: "#11131b",
      backgroundElevated: "#202331",
      surface: "#202331",
      surfaceElevated: "#292d3d",
      border: "#3a4054",
      borderStrong: "#697089",
      textPrimary: "#edf2f7",
      textSecondary: "#cbd5e1",
      textMuted: "#9aa6b8",
      accent: "#7dd3fc",
      accentHover: "#bae6fd",
      accentSoft: "rgba(125, 211, 252, 0.16)",
      success: "#6ee7b7",
      warning: "#facc15",
      danger: "#fca5a5",
    },
  },
  {
    id: "soft-light",
    name: "Soft Light",
    description: "Warmer light surfaces with a calmer HR dashboard feel.",
    mode: "light",
    badge: "",
    tokens: {
      ...shared,
      background: "#fbfaf7",
      backgroundDeep: "#f2efe8",
      backgroundElevated: "#fffdf8",
      surface: "#fffdf8",
      surfaceElevated: "#ffffff",
      border: "#d8d0c4",
      borderStrong: "#a99f91",
      textPrimary: "#1f2933",
      textSecondary: "#40505f",
      textMuted: "#667585",
      accent: "#0f766e",
      accentHover: "#0b5f59",
      accentSoft: "#dff7f3",
      success: "#087f5b",
      warning: "#936400",
      danger: "#b42318",
    },
  },
  {
    id: "clear-spectrum",
    name: "Clear Spectrum",
    description: "Colorblind-friendly accents with strong status separation.",
    mode: "light",
    badge: "Beta",
    tokens: {
      ...shared,
      background: "#f7f9fb",
      backgroundDeep: "#e9eef5",
      backgroundElevated: "#ffffff",
      surface: "#ffffff",
      surfaceElevated: "#ffffff",
      border: "#cbd5e1",
      borderStrong: "#8796a9",
      textPrimary: "#111827",
      textSecondary: "#374151",
      textMuted: "#5b6778",
      accent: "#005fcc",
      accentHover: "#004799",
      accentSoft: "#dbeafe",
      success: "#00875a",
      warning: "#b35c00",
      danger: "#c4002f",
    },
  },
];

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Apply a named preset to an element by setting the same CSS variables the
 * prototype sets at runtime. Also stamps data-theme so light/dark base rules and
 * default token fallbacks resolve. Pass a preset id or a ThemePreset.
 */
export function applyTheme(
  target: HTMLElement,
  preset: string | ThemePreset,
): void {
  const p =
    typeof preset === "string"
      ? THEME_PRESETS.find((t) => t.id === preset)
      : preset;
  if (!p) return;
  const t = p.tokens;
  const set = (name: string, value: string) => target.style.setProperty(name, value);

  target.setAttribute("data-theme", p.mode);

  set("--bg", t.background);
  set("--bg-deep", t.backgroundDeep);
  set("--bg-elevated", t.backgroundElevated);
  set("--panel", t.surface);
  set("--panel-strong", t.surface);
  set("--surface", t.surface);
  set("--surface-elevated", t.surfaceElevated);
  set("--text", t.textPrimary);
  set("--text-primary", t.textPrimary);
  set("--text-secondary", t.textSecondary);
  set("--text-muted", t.textMuted);
  set("--muted", t.textMuted);
  set("--line", t.border);
  set("--border-subtle", t.border);
  set("--border-strong", t.borderStrong);
  set("--accent", t.accent);
  set("--accent-hover", t.accentHover);
  set("--accent-soft", t.accentSoft || withAlpha(t.accent, 0.2));
  set("--accent-bg", withAlpha(t.accent, 0.14));
  set("--success", t.success);
  set("--success-bg", withAlpha(t.success, 0.16));
  set("--success-soft", withAlpha(t.success, 0.1));
  set("--warning", t.warning);
  set("--warning-bg", withAlpha(t.warning, 0.18));
  set("--warning-soft", withAlpha(t.warning, 0.11));
  set("--danger", t.danger);
  set("--danger-bg", withAlpha(t.danger, 0.16));
  set("--danger-soft", withAlpha(t.danger, 0.1));
  set("--radius-sm", t.radiusSm);
  set("--radius-md", t.radiusMd);
  set("--radius-lg", t.radiusLg);
  set("--radius-xl", t.radiusXl);
  set("--icon-btn-size", t.iconBtnSize);
}
