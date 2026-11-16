import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "../api/client";

type Options<T> = Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">;

/** Typed wrapper over TanStack Query. Features keep their own keys and query hooks. */
export function useApiQuery<T>(key: QueryKey, fn: () => Promise<T>, options?: Options<T>) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: fn,
    retry: (count, error) => error.status >= 500 && count < 1,
    staleTime: 30_000,
    ...options,
  });
}
