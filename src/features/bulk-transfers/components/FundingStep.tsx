import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import { fundBatch, rejectFunding, verifyBatchAccounts } from "../api/bulkApi";
import { bulkKeys, useSourceBalances } from "../api/queries";
import type { BulkBatch, PayeeCheck } from "../model/types";
import { PayFromCard } from "./PayFromCard";

const SHOWN_PROBLEMS = 6;

/**
 * Step two. The second person picks the account the batch is paid from, sees what it holds and what is left afterwards,
 * can check the payees' accounts, and then passes the batch on for approval or rejects it.
 */
export function FundingStep({
  batch,
  blockedReason,
}: {
  batch: BulkBatch;
  blockedReason?: string;
}) {
  const queryClient = useQueryClient();
  const balances = useSourceBalances();
  const sources = balances.data ?? [];
  const [picked, setPicked] = useState("");
  const [dialog, setDialog] = useState<"pass" | "reject" | null>(null);
  const verification = useMutation({ mutationFn: () => verifyBatchAccounts(batch.id) });
  const checks = verification.data ?? null;
  const checking = verification.isPending;
  const checkFailed = verification.isError;

  // Until one is picked, the first account is used.
  const chosen = picked || sources[0]?.id || "";
  const source = sources.find((item) => item.id === chosen);
  const debitKobo = batch.totalKobo + batch.feeKobo;
  const covered =
    source?.balanceKobo !== null &&
    source?.balanceKobo !== undefined &&
    source.balanceKobo >= debitKobo;
  const refresh = () => queryClient.invalidateQueries({ queryKey: bulkKeys.all });

  const results = checks ? [...checks.entries()] : [];
  const count = (status: PayeeCheck["status"]) =>
    results.filter(([, item]) => item.status === status).length;
  const problems = results.filter(([, item]) => item.status !== "verified");

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("bulk.fund.title")} description={t("bulk.fund.description")}>
        <div className="max-w-md">
          <Label htmlFor="fund-source">{t("bulk.field.source")}</Label>
          <Select value={chosen} onValueChange={setPicked} disabled={Boolean(blockedReason)}>
            <SelectTrigger id="fund-source" className="mt-1 h-[52px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <PayFromCard sourceId={chosen || null} debitKobo={debitKobo} />

      <SectionCard title={t("bulk.fund.verifyTitle")} description={t("bulk.fund.verifyHint")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={checking || Boolean(blockedReason)}
            onClick={() => verification.mutate()}
          >
            {checking ? t("bulk.verify.running") : t("bulk.verify.button")}
          </Button>
          {checks ? (
            <output className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone="success"
                label={t("bulk.verify.count.verified", { count: count("verified") })}
              />
              <StatusBadge
                tone="warning"
                label={t("bulk.verify.count.warning", { count: count("warning") })}
              />
              <StatusBadge
                tone="danger"
                label={t("bulk.verify.count.invalid", { count: count("invalid") })}
              />
            </output>
          ) : null}
        </div>
        {checkFailed ? (
          <p role="alert" className="m-0 mt-3 text-sm text-danger-text">
            {t("bulk.verify.error")}
          </p>
        ) : null}
        {problems.length > 0 ? (
          <ul className="m-0 mt-4 list-none divide-y divide-border overflow-hidden rounded-md border border-border p-0">
            {problems.slice(0, SHOWN_PROBLEMS).map(([row, item]) => (
              <li key={row} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-3 py-2.5">
                <span className="w-16 shrink-0 text-sm font-medium text-ink">
                  {t("bulk.fund.rowLabel", { row })}
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <div className="flex flex-wrap gap-1.5">
                    {item.issues.map((issue) => (
                      <StatusBadge
                        key={issue}
                        tone={item.status === "invalid" ? "danger" : "warning"}
                        label={t(`bulk.verify.issue.${issue}`)}
                      />
                    ))}
                  </div>
                  {item.accountName ? (
                    <span className="text-xs text-muted-text">
                      {t("bulk.verify.accountName", { name: item.accountName })}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
            {problems.length > SHOWN_PROBLEMS ? (
              <li className="bg-surface-muted px-3 py-2 text-xs text-muted-text">
                {t("bulk.review.more", { count: problems.length - SHOWN_PROBLEMS })}
              </li>
            ) : null}
          </ul>
        ) : null}
      </SectionCard>

      {blockedReason ? (
        <output className="block rounded-md bg-warning-bg p-3 text-sm text-warning-text">
          {blockedReason}
        </output>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={Boolean(blockedReason)}
          onClick={() => setDialog("reject")}
        >
          {t("bulk.reject")}
        </Button>
        <Button disabled={Boolean(blockedReason) || !covered} onClick={() => setDialog("pass")}>
          {t("bulk.fund.submit")}
        </Button>
      </div>

      <ActionDialog
        open={dialog === "pass"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("bulk.fund.dialog.title")}
        description={batch.name}
        impact={t("bulk.fund.dialog.impact", {
          count: batch.itemCount,
          source: source?.name ?? chosen,
        })}
        confirmLabel={t("bulk.fund.submit")}
        onConfirm={async ({ reason }) => {
          await fundBatch({ id: batch.id, sourceAccount: chosen, reason });
          await refresh();
          return t("bulk.fund.done");
        }}
      />
      <ActionDialog
        open={dialog === "reject"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("bulk.reject")}
        description={batch.name}
        impact={t("bulk.reject.impact")}
        confirmLabel={t("bulk.reject")}
        destructive
        onConfirm={async ({ reason }) => {
          await rejectFunding(batch.id, reason);
          await refresh();
          return t("bulk.reject.done");
        }}
      />
    </div>
  );
}
