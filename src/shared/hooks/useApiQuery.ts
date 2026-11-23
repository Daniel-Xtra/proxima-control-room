import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "../api/client";

type Options<T, R> = Omit<UseQueryOptions<T, ApiError, R>, "queryKey" | "queryFn"> & {
  /**
   * Keeps the rows on screen while the next page loads. Any other change (a filter, a search, the sort) shows
   * the loading state instead, so rows from a different filter are never shown under the new one.
   */
  keepPreviousPage?: boolean;
};

/** The key with every `page` setting removed, so two keys can be compared apart from the page. */
function withoutPage(key: QueryKey | undefined) {
  return JSON.stringify(key ?? [], (name, value) => (name === "page" ? undefined : value));
}

/** Typed wrapper over TanStack Query. Features keep their own keys and query hooks. */
export function useApiQuery<T, R = T>(
  key: QueryKey,
  fn: () => Promise<T>,
  { keepPreviousPage, ...options }: Options<T, R> = {},
) {
  const placeholderData: UseQueryOptions<T, ApiError, R>["placeholderData"] = keepPreviousPage
    ? (previous, previousQuery) =>
        withoutPage(previousQuery?.queryKey) === withoutPage(key) ? previous : undefined
    : undefined;
  return useQuery<T, ApiError, R>({
    queryKey: key,
    queryFn: fn,
    retry: (count, error) => error.status >= 500 && count < 1,
    staleTime: 30_000,
    placeholderData,
    ...options,
  });
}
