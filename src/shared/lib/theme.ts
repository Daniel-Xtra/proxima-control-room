import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "proxima.theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initial(): Theme {
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Fall through to the system setting.
  }
  return systemTheme();
}

let current: Theme = "light";
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  current = theme;
  document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((listener) => listener());
}

/** Called once before the first render so the sign-in page also follows the saved choice. */
export function applyStoredTheme() {
  apply(initial());
}

export function setTheme(theme: Theme) {
  apply(theme);
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // The choice still applies for this visit.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current);
  return { theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
