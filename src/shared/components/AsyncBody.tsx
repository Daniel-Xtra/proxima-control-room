import { Prohibit, ShieldSlash, WarningCircle } from "@phosphor-icons/react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { isNoResponse, type ApiError } from "../api/client";
import { t } from "../i18n/t";
import { EmptyState } from "./EmptyState";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";

type QueryLike<T> = Pick<
  UseQueryResult<T, ApiError>,
  "data" | "isLoading" | "isError" | "error" | "refetch"
>;

interface AsyncBodyProps<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
}

/** One place for loading, error, forbidden and empty states. */
export function AsyncBody<T>({
  query,
  children,
  isEmpty,
  emptyTitle = t("state.empty.title"),
  emptyDescription,
  skeletonRows = 6,
}: AsyncBodyProps<T>) {
  if (query.isLoading) {
    return (
      <output aria-label={t("state.loading")} className="flex flex-col gap-2 p-4">
        {Array.from({ length: skeletonRows }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </output>
    );
  }

  if (query.isError) {
    if (query.error?.status === 403) {
      return (
        <EmptyState
          icon={ShieldSlash}
          title={t("state.forbidden.title")}
          description={t("state.forbidden.description")}
        />
      );
    }
    if (query.error?.status === 501) {
      return (
        <EmptyState
          icon={Prohibit}
          title={t("state.unavailable.title")}
          description={t("api.unavailable")}
        />
      );
    }
    // No response at all (server down or unreachable, or a gateway that cannot reach it): there is
    // no data to show, so use the empty state, with a way to try again.
    if (isNoResponse(query.error)) {
      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={WarningCircle}
        title={t("state.error.title")}
        description={query.error?.message}
        action={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const data = query.data;
  if (data === undefined) return null;
  if (isEmpty?.(data)) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children(data)}</>;
}
