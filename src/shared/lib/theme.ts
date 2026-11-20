import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
export const THEMES: Theme[] = ["system", "light", "dark"];
const KEY = "proxima.theme";

const query = () => window.matchMedia("(prefers-color-scheme: dark)");

function stored(): Theme {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

let choice: Theme = "system";
let resolved: "light" | "dark" = "light";
const listeners = new Set<() => void>();

/** "system" follows the operating system and keeps following it while the app is open. */
function apply(theme: Theme) {
  choice = theme;
  resolved = theme === "system" ? (query().matches ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  listeners.forEach((listener) => listener());
}

/** Called once before the first render so the sign-in page also follows the saved choice. */
export function applyStoredTheme() {
  apply(stored());
  query().addEventListener("change", () => {
    if (choice === "system") apply("system");
  });
}

/**
 * A theme change fades the whole page at once. Components that happen to have their own colour transitions would
 * otherwise fade while the rest snaps, so the browser cross-fades a before-and-after picture instead.
 */
function applyWithFade(theme: Theme) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || calm) apply(theme);
  else doc.startViewTransition(() => apply(theme));
}

export function setTheme(theme: Theme) {
  applyWithFade(theme);
  try {
    if (theme === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, theme);
  } catch {
    // The choice still applies for this visit.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => choice);
  const actual = useSyncExternalStore(subscribe, () => resolved);
  const next = () => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!);
  return { theme, resolved: actual, next };
}
