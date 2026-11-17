import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Stepper, type Step } from "@/shared/components/Stepper";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { formatLagos } from "@/shared/lib/format";
import { createBatch } from "../api/bulkApi";
import { bulkKeys, useSourceBalances } from "../api/queries";
import { BatchSummaryPanel } from "../components/BatchSummaryPanel";
import { DetailsStep } from "../components/DetailsStep";
import { PayeesStep } from "../components/PayeesStep";
import { ReviewStep } from "../components/ReviewStep";
import {
  EMPTY_DRAFT,
  detailsComplete,
  draftTotals,
  payeesComplete,
  scheduledDate,
  type BatchDraft,
} from "../model/draft";
import { LARGE_BATCH_KOBO, type BalanceInfo } from "../model/types";

const STEPS = ["details", "payees", "review"] as const;

export function NewBulkPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stored, setDraft] = useState<BatchDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string>();
  // Fixed when the page opens, so the allowed scheduling window does not shift while you type.
  const [now] = useState(() => new Date());

  const balances = useSourceBalances();
  const sources = balances.data ?? [];
  // Until one is picked, the first source is used.
  const draft: BatchDraft = { ...stored, source: stored.source || sources[0]?.id || "" };
  const chosen = sources.find((source) => source.id === draft.source);
  const balance: BalanceInfo =
    chosen?.error || (balances.status === "success" && !chosen)
      ? { status: "error" }
      : { status: balances.status, kobo: chosen?.balanceKobo ?? undefined };

  const update = (patch: Partial<BatchDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const stepReady = [detailsComplete(draft, now), payeesComplete(draft), true] as const;
  const totals = draftTotals(draft.payees);
  const when = scheduledDate(draft);
  const last = step === STEPS.length - 1;
  // A batch the account cannot cover is never submitted; an unknown balance blocks it too.
  const canAfford = balance.status === "success" && (balance.kobo ?? 0) >= totals.debitKobo;

  const steps: Step[] = STEPS.map((key, index) => ({
    key,
    label: t(`bulk.step.${key}`),
    state: index < step ? "done" : index === step ? "current" : "upcoming",
  }));

  return (
    <>
      <PageHeader
        title={t("bulk.new")}
        description={t("bulk.new.description")}
        crumbs={[
          { label: t("nav.group.payments") },
          { label: t("bulk.title"), to: "/bulk-payments" },
          { label: t("bulk.new") },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/bulk-payments")}>
            {t("common.cancel")}
          </Button>
        }
      />

      <div className="mb-5">
        <Stepper steps={steps} label={t("bulk.steps.label")} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          {step === 0 ? (
            <DetailsStep
              draft={draft}
              onChange={update}
              now={now}
              balance={balance}
              sources={sources}
            />
          ) : null}
          {step === 1 ? (
            <PayeesStep
              payees={draft.payees}
              onPayeesChange={(change) =>
                setDraft((current) => ({ ...current, payees: change(current.payees) }))
              }
            />
          ) : null}
          {step === 2 ? <ReviewStep draft={draft} balance={balance} /> : null}

          <div className="flex items-center justify-between gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft aria-hidden="true" />
                {t("common.back")}
              </Button>
            ) : (
              <span />
            )}
            {last ? (
              <Button disabled={!canAfford} onClick={() => setConfirmOpen(true)}>
                {t("bulk.submit")}
              </Button>
            ) : (
              <Button disabled={!stepReady[step]} onClick={() => setStep(step + 1)}>
                {t("common.continue")}
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <aside aria-label={t("bulk.summary.title")} className="lg:sticky lg:top-20">
          <BatchSummaryPanel draft={draft} balance={balance} />
        </aside>
      </div>

      <ActionDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && createdId) navigate(`/bulk-payments/${createdId}`);
        }}
        title={t("bulk.submit.title")}
        description={draft.name}
        impact={
          when
            ? t("bulk.submit.impactScheduled", {
                count: totals.count,
                when: formatLagos(when.toISOString()),
              })
            : t("bulk.submit.impact", { count: totals.count })
        }
        confirmLabel={t("bulk.submit")}
        typedConfirmation={totals.debitKobo > LARGE_BATCH_KOBO}
        onConfirm={async ({ reason }) => {
          const batch = await createBatch({
            name: draft.name.trim(),
            sourceAccount: draft.source,
            payees: draft.payees,
            reason,
            scheduledFor: when?.toISOString(),
          });
          setCreatedId(batch.id);
          await queryClient.invalidateQueries({ queryKey: bulkKeys.all });
          return t("bulk.submit.done");
        }}
      />
    </>
  );
}
