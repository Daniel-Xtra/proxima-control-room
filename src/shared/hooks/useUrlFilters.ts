import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filters that live in the URL so a filtered view can be shared and survives reload.
 * Changing any filter other than `page` resets the page to 1.
 */
export function useUrlFilters<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams();

  const values = {} as Record<K, string>;
  for (const key of Object.keys(defaults) as K[]) {
    values[key] = params.get(key) ?? defaults[key];
  }

  const setFilter = useCallback(
    (key: K, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value === defaults[key]) next.delete(key);
          else next.set(key, value);
          if (key !== ("page" as K)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [defaults, setParams],
  );

  return [values, setFilter] as const;
}
