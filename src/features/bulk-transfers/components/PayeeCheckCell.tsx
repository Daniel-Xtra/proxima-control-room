import { StatusBadge } from "@/shared/components/StatusBadge";
import { t } from "@/shared/i18n/t";
import type { PayeeCheck } from "../model/types";

/** The result of verifying one row: a badge, then what was wrong and the name the account really has. */
export function PayeeCheckCell({ check }: { check: PayeeCheck }) {
  const tone =
    check.status === "verified" ? "success" : check.status === "warning" ? "warning" : "danger";
  const label =
    check.status === "verified"
      ? t("bulk.verify.verified")
      : t(`bulk.verify.issue.${check.issues[0] ?? "lookup_failed"}`);

  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge tone={tone} label={label} />
      {check.issues.slice(1).map((issue) => (
        <span key={issue} className="whitespace-normal text-xs text-muted-text">
          {t(`bulk.verify.issue.${issue}`)}
        </span>
      ))}
      {check.accountName ? (
        <span className="whitespace-normal text-xs text-muted-text">
          {t("bulk.verify.accountName", { name: check.accountName })}
        </span>
      ) : null}
    </div>
  );
}
