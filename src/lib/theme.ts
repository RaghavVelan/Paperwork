export type ThemeMode = "light" | "dark" | "system";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export const THEME_COLOR = {
  light: "#f3f1ec",
  dark: "#0c0c0d",
} as const;

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(mode: ThemeMode, prefersDark?: boolean): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  const dark =
    prefersDark ??
    (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return dark ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[resolved]);
}

/** Runs before paint so the first frame matches the saved preference. */
export const THEME_BOOTSTRAP = `(function(){try{var mode="system";var raw=localStorage.getItem("paperwork.ledger.v5");if(raw){var data=JSON.parse(raw);var p=data.profile||(data.state&&data.state.profile);if(p&&(p.theme==="light"||p.theme==="dark"||p.theme==="system"))mode=p.theme;}var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=mode==="light"?"light":mode==="dark"?"dark":dark?"dark":"light";var root=document.documentElement;root.dataset.theme=resolved;root.style.colorScheme=resolved;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",resolved==="dark"?"#0c0c0d":"#f3f1ec");}catch(e){try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light";}catch(e2){document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";}}})();`;
