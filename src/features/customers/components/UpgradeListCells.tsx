import { DotsThreeVertical } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { t } from "@/shared/i18n/t";
import type { UpgradeRequest } from "../model/types";

const reviewPath = (row: UpgradeRequest) => `/customers/${row.id}?tab=kyc`;

/** The name as a link to the review, an orange dot while documents are waiting, and how many were submitted. */
export function UpgradeNameCell({ row }: { row: UpgradeRequest }) {
  return (
    <Link to={reviewPath(row)} className="group flex min-w-0 items-start gap-2">
      {row.awaitingDocuments > 0 ? (
        <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-warning-solid" />
      ) : null}
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink group-hover:underline">
          {row.name}
        </span>
        <span className="block truncate text-xs text-muted-text">
          {t("customers.upgrade.documents", { count: row.documents })}
        </span>
      </span>
    </Link>
  );
}

/** The three-dot menu at the end of a row. */
export function UpgradeRowMenu({ row }: { row: UpgradeRequest }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("customers.actions")}: ${row.name}`}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-text hover:bg-surface-muted hover:text-ink"
        >
          <DotsThreeVertical aria-hidden="true" size={18} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => navigate(reviewPath(row))}>
          {t("customers.upgrade.review")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/customers/${row.id}`)}>
          {t("customers.view")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
