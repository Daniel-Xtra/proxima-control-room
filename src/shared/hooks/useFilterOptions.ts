import { getFilterOptions, type FilterName, type FilterOption } from "../api/filters";
import { useApiQuery } from "./useApiQuery";

const NONE: FilterOption[] = [];

/**
 * The server's choices for one filter dropdown. Empty until they load, and when the server cannot be reached, so a screen
 * can fall back to what it already knows.
 */
export function useFilterOptions(name: FilterName): FilterOption[] {
  const query = useApiQuery(["filters", name], () => getFilterOptions(name), {
    // Choices change with a release, not minute to minute.
    staleTime: 10 * 60_000,
    select: (sets) => sets[name],
  });
  return query.data ?? NONE;
}
