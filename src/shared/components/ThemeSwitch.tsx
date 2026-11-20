import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { t } from "../i18n/t";
import { cn } from "../lib/cn";
import { THEMES, setTheme, useTheme } from "../lib/theme";

/** System, Light and Dark as one segmented control. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme } = useTheme();
  return (
    <fieldset
      className={cn(
        "m-0 grid min-w-0 grid-cols-3 gap-1 rounded-lg border-0 bg-surface-muted p-1",
        className,
      )}
    >
      <legend className="sr-only">{t("shell.theme")}</legend>
      {THEMES.map((option) => {
        const Glyph = option === "dark" ? Moon : option === "light" ? Sun : Monitor;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={theme === option}
            onClick={() => setTheme(option)}
            className={cn(
              "flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-medium",
              theme === option ? "bg-card text-ink shadow-sm" : "text-muted-text hover:text-ink",
            )}
          >
            <Glyph aria-hidden="true" className="size-3.5" />
            {t(`shell.theme.${option}`)}
          </button>
        );
      })}
    </fieldset>
  );
}
