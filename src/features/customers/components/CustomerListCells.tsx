import { Link } from "react-router-dom";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";
import type { CustomerRow } from "../model/types";

/** An initials avatar, the name as the link to the record, and the account number under it. */
export function CustomerNameCell({ row }: { row: CustomerRow }) {
  return (
    <Link to={`/customers/${row.id}`} className="group flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-bg text-xs font-semibold text-success-text"
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
