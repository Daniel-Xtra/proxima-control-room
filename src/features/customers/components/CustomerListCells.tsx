import { DotsThreeVertical } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";
import type { CustomerRow } from "../model/types";

/** An initials avatar, the name as the link to the record, and the account number under it. */
export function CustomerNameCell({ row }: { row: CustomerRow }) {
  return (
    <Link to={`/customers/${row.id}`} className="group flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-bg text-xs font-semibold text-success-text"
      >
        {initials(row.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink group-hover:underline">
          {row.name}
        </span>
        <span className="tabular block truncate text-xs text-muted-text">
          {row.reservedAccount ?? t("common.notAvailable")}
        </span>
      </span>
    </Link>
  );
}

/** The three-dot menu at the end of a row. */
export function CustomerRowMenu({ row }: { row: CustomerRow }) {
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
        <DropdownMenuItem onSelect={() => navigate(`/customers/${row.id}`)}>
          {t("customers.view")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
