import { Link } from "react-router-dom";
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
