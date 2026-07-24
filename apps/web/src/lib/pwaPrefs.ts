import {
  DEFAULT_THEME,
  isThemeId,
  THEMES,
  type ThemeId,
} from "./themes";

export const PWA_PREFS_KEY = "stock-diary-pwa-prefs";

export type PwaPrefs = {
  iconPreset: ThemeId;
};

export function readPwaPrefs(): PwaPrefs {
  try {
    const raw = localStorage.getItem(PWA_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { iconPreset?: string };
      if (parsed.iconPreset && isThemeId(parsed.iconPreset)) {
        return { iconPreset: parsed.iconPreset };
      }
    }
  } catch {
    // ignore
  }
  return { iconPreset: DEFAULT_THEME };
}

export function writePwaPrefs(prefs: PwaPrefs) {
  try {
    localStorage.setItem(PWA_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function pwaIconPath(_preset?: ThemeId, size: 180 | 192 | 512 = 180) {
  if (size === 512) return "/pwa-512.png";
  return "/pwa-192.png";
}

export function applyPwaPrefs(prefs: PwaPrefs = readPwaPrefs()) {
  const theme = THEMES.find((t) => t.id === prefs.iconPreset) ?? THEMES[0];
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.themeColor);
  document
    .querySelector('link[rel="apple-touch-icon"]')
    ?.setAttribute("href", "/pwa-192.png");
  document
    .querySelector('meta[name="apple-mobile-web-app-title"]')
    ?.setAttribute("content", "增长日记");
}
