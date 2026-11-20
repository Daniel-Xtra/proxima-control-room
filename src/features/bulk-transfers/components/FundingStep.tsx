import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { SectionCard } from "@/shared/components/SectionCard";
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
  const [checks, setChecks] = useState<Map<number, PayeeCheck> | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  // Until one is picked, the first account is used.
  const chosen = picked || sources[0]?.id || "";
  const source = sources.find((item) => item.id === chosen);
  const debitKobo = batch.totalKobo + batch.feeKobo;
  const covered =
    source?.balanceKobo !== null &&
    source?.balanceKobo !== undefined &&
    source.balanceKobo >= debitKobo;
  const refresh = () => queryClient.invalidateQueries({ queryKey: bulkKeys.all });

  async function verify() {
    setChecking(true);
    setCheckFailed(false);
    try {
      setChecks(await verifyBatchAccounts(batch.id));
    } catch {
      setCheckFailed(true);
    } finally {
      setChecking(false);
    }
  }

  const results = checks ? [...checks.entries()] : [];
  const count = (status: PayeeCheck["status"]) =>
    results.filter(([, check]) => check.status === status).length;
  const problems = results.filter(([, check]) => check.status !== "verified");

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
          <Button variant="outline" disabled={checking || Boolean(blockedReason)} onClick={verify}>
            {checking ? t("bulk.verify.running") : t("bulk.verify.button")}
          </Button>
          {checks ? (
            <output className="text-sm text-muted-text">
              {t("bulk.verify.done", {
                verified: count("verified"),
                warning: count("warning"),
                invalid: count("invalid"),
              })}
            </output>
          ) : null}
        </div>
        {checkFailed ? (
          <p role="alert" className="m-0 mt-3 text-sm text-danger-text">
            {t("bulk.verify.error")}
          </p>
        ) : null}
        {problems.length > 0 ? (
          <ul className="m-0 mt-3 list-none space-y-1 p-0 text-sm">
            {problems.slice(0, SHOWN_PROBLEMS).map(([row, check]) => (
              <li
                key={row}
                className={check.status === "invalid" ? "text-danger-text" : "text-warning-text"}
              >
                {t("bulk.fund.row", {
                  row,
                  issues: check.issues.map((issue) => t(`bulk.verify.issue.${issue}`)).join(", "),
                })}
              </li>
            ))}
            {problems.length > SHOWN_PROBLEMS ? (
              <li className="text-muted-text">
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
