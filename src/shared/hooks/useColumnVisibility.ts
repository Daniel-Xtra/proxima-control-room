import { useCallback, useState } from "react";

function read(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(`proxima.columns.${storageKey}`);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [],
    );
  } catch {
    return new Set();
  }
}

/** Hidden columns for one table, remembered per browser. Tracks what is hidden, not what is shown. */
export function useColumnVisibility(storageKey: string) {
  const [hidden, setHidden] = useState<Set<string>>(() => read(storageKey));

  const persist = useCallback(
    (next: Set<string>) => {
      try {
        window.localStorage.setItem(`proxima.columns.${storageKey}`, JSON.stringify([...next]));
      } catch {
        // The choice still applies for this visit.
      }
      return next;
    },
    [storageKey],
  );

  const toggle = useCallback(
    (key: string) =>
      setHidden((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return persist(next);
      }),
    [persist],
  );

  const reset = useCallback(() => setHidden(persist(new Set())), [persist]);

  return { hidden, toggle, reset };
}
