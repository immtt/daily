export type ThemeId =
  | "inkgold"
  | "festive"
  | "ocean"
  | "forest"
  | "dark"
  | "minimal"
  | "lavender"
  | "tech";

export type ThemeDef = {
  id: ThemeId;
  name: string;
  swatch: string;
  themeColor: string;
};

export const THEMES: ThemeDef[] = [
  { id: "inkgold", name: "墨金典雅", swatch: "#c9a227", themeColor: "#0f1218" },
  { id: "festive", name: "喜庆红金", swatch: "#c41e3a", themeColor: "#c41e3a" },
  { id: "ocean", name: "海洋蓝", swatch: "#1677ff", themeColor: "#1677ff" },
  { id: "forest", name: "森系绿", swatch: "#2d8a4e", themeColor: "#2d8a4e" },
  { id: "dark", name: "夜盘深色", swatch: "#1a1f2e", themeColor: "#1a1f2e" },
  { id: "minimal", name: "极简白", swatch: "#595959", themeColor: "#ffffff" },
  { id: "lavender", name: "薰衣草", swatch: "#7c5cbf", themeColor: "#7c5cbf" },
  { id: "tech", name: "赛博科技", swatch: "#00d4ff", themeColor: "#070b14" },
];

export const DEFAULT_THEME: ThemeId = "inkgold";
export const THEME_STORAGE_KEY = "stock-diary-theme";

export function isThemeId(v: string): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}
