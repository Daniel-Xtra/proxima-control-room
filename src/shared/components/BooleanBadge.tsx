import { t } from "../i18n/t";
import { StatusBadge } from "./StatusBadge";

export function BooleanBadge({
  value,
  trueLabel = t("common.yes"),
  falseLabel = t("common.no"),
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return value ? (
    <StatusBadge tone="success" label={trueLabel} />
  ) : (
    <StatusBadge tone="neutral" label={falseLabel} />
  );
}
