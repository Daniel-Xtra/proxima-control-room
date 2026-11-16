import { useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "proxima.theme";
export const THEMES: Theme[] = ["system", "light", "dark"];

function stored(): Theme {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

/** "system" leaves data-theme off so the operating system decides; light and dark force it. */
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Called once before the first render so the sign-in page also follows the saved choice. */
export function applyStoredTheme() {
  apply(stored());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(stored);
  useEffect(() => {
    apply(theme);
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      // The choice still applies for this visit.
    }
  }, [theme]);
  const next = () => setTheme((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]!);
  return { theme, next };
}
