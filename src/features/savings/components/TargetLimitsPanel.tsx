import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t, type MessageKey } from "@/shared/i18n/t";
import { requestProductChange } from "../api/settingsApi";
import { savingsSettingsKeys } from "../api/settingsQueries";
import { isAmount, koboToNaira, nairaToKobo } from "../model/settingsMoney";
import type { SavingsProduct, TargetSavingsLimits } from "../model/settingsTypes";

interface Props {
  /** The target savings product; missing when the API sends no limits. */
  product: SavingsProduct | undefined;
  /** Holds the permission to ask for savings settings changes. */
  editable: boolean;
}

interface Row {
  key: keyof TargetSavingsLimits;
  /** The API's name for this limit. */
  field: string;
  label: MessageKey;
  applies: MessageKey;
  form: MessageKey;
}

const ROWS: Row[] = [
  {
    key: "minTargetKobo",
    field: "min_target_amount",
    label: "savingsSettings.limit.minTarget",
    applies: "savingsSettings.limit.minTarget.applies",
    form: "savingsSettings.limit.form.minTarget",
  },
  {
    key: "minTopUpKobo",
    field: "min_top_up_amount",
    label: "savingsSettings.limit.minTopUp",
    applies: "savingsSettings.limit.minTopUp.applies",
    form: "savingsSettings.limit.form.minTopUp",
  },
  {
    key: "minWithdrawalKobo",
    field: "min_withdrawal_amount",
    label: "savingsSettings.limit.minWithdrawal",
    applies: "savingsSettings.limit.minWithdrawal.applies",
    form: "savingsSettings.limit.form.minWithdrawal",
  },
  {
    key: "minRecurringKobo",
    field: "min_recurring_amount",
    label: "savingsSettings.limit.minRecurring",
    applies: "savingsSettings.limit.minRecurring.applies",
    form: "savingsSettings.limit.form.minRecurring",
  },
];

const MIN_KOBO = 100;

export function TargetLimitsPanel({ product, editable }: Props) {
  const queryClient = useQueryClient();
  const limits = product?.limits;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const kobo = (row: Row) => nairaToKobo(form[row.key] ?? "");
  const valid = ROWS.every((row) => isAmount(form[row.key] ?? "") && kobo(row) >= MIN_KOBO);

  /** Only the limits that differ from the live ones, in the API's names. */
  function changes(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!limits) return out;
    for (const row of ROWS) if (kobo(row) !== limits[row.key]) out[row.field] = kobo(row);
    return out;
  }

  function begin() {
    if (!limits) return;
    setForm(Object.fromEntries(ROWS.map((row) => [row.key, koboToNaira(limits[row.key])])));
    setOpen(true);
  }

  return (
    <SectionCard
      title={t("savingsSettings.limits.title")}
      description={t("savingsSettings.limits.description")}
      flush
      actions={
        editable && limits ? (
          <Button variant="outline" onClick={begin}>
            {t("savingsSettings.edit")}
          </Button>
        ) : null
      }
    >
      <SimpleTable<Row>
        storageKey="target-savings-limits"
        caption={t("savingsSettings.limits.title")}
        rows={limits ? ROWS : []}
        getRowId={(r) => r.key}
        columns={[
          { key: "limit", header: t("savingsSettings.col.limit"), cell: (r) => t(r.label) },
          {
            key: "value",
            header: t("savingsSettings.col.value"),
            align: "right",
            cell: (r) => <MoneyText kobo={limits?.[r.key] ?? 0} />,
          },
          { key: "applies", header: t("savingsSettings.col.applies"), cell: (r) => t(r.applies) },
        ]}
      />
      <p className="m-0 border-t border-border-soft px-4 py-3 text-xs text-muted-text">
        {t("savingsSettings.limits.help")}
      </p>

      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("savingsSettings.limits.edit.title")}
        impact={t("savingsSettings.submit.impact")}
        confirmLabel={t("savingsSettings.submit")}
        blocked={!valid || Object.keys(changes()).length === 0}
        onConfirm={async ({ reason }) => {
          if (product) await requestProductChange(product.code, changes(), reason);
          await queryClient.invalidateQueries({ queryKey: savingsSettingsKeys.all });
          return t("savingsSettings.submitted");
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {ROWS.map((row) => (
            <div key={row.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`limit-${row.key}`}>{t(row.form)}</Label>
              <Input
                id={`limit-${row.key}`}
                inputMode="decimal"
                value={form[row.key] ?? ""}
                onChange={(event) => setForm({ ...form, [row.key]: event.target.value })}
              />
            </div>
          ))}
        </div>
        {!valid && Object.values(form).some((value) => value !== "") ? (
          <p role="alert" className="text-sm text-danger-text">
            {t("savingsSettings.err.limit")}
          </p>
        ) : null}
      </ActionDialog>
    </SectionCard>
  );
}
