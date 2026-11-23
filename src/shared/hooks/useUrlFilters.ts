import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filters that live in the URL so a filtered view can be shared and survives reload.
 * Changing any filter other than `page` resets the page to 1.
 *
 * `setFilter` changes one filter. To change several at once, such as "Clear filters" or a sort and its
 * direction, use `setFilters` or `resetFilters`: router updates made one after another in the same event do not
 * build on each other, so separate `setFilter` calls would leave only the last change in place.
 */
export function useUrlFilters<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams();

  const values = {} as Record<K, string>;
  for (const key of Object.keys(defaults) as K[]) {
    values[key] = params.get(key) ?? defaults[key];
  }

  const setFilters = useCallback(
    (patch: Partial<Record<K, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of Object.keys(patch) as K[]) {
            const value = patch[key] ?? "";
            if (value === "" || value === defaults[key]) next.delete(key);
            else next.set(key, value);
          }
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [defaults, setParams],
  );

  const setFilter = useCallback(
    (key: K, value: string) => setFilters({ [key]: value } as Partial<Record<K, string>>),
    [setFilters],
  );

  /** Puts the named filters back to their defaults in one update. */
  const resetFilters = useCallback(
    (keys: readonly K[]) =>
      setFilters(
        Object.fromEntries(keys.map((key) => [key, defaults[key]])) as Partial<Record<K, string>>,
      ),
    [defaults, setFilters],
  );

  return [values, setFilter, { setFilters, resetFilters }] as const;
}
