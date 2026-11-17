import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "../api/client";

type Options<T, R> = Omit<UseQueryOptions<T, ApiError, R>, "queryKey" | "queryFn">;

/** Typed wrapper over TanStack Query. Features keep their own keys and query hooks. */
export function useApiQuery<T, R = T>(
  key: QueryKey,
  fn: () => Promise<T>,
  options?: Options<T, R>,
) {
  return useQuery<T, ApiError, R>({
    queryKey: key,
    queryFn: fn,
    retry: (count, error) => error.status >= 500 && count < 1,
    staleTime: 30_000,
    ...options,
  });
}
