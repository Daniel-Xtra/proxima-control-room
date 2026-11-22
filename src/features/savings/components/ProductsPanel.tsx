import { PencilSimple } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { requestProductChange } from "../api/settingsApi";
import { savingsSettingsKeys } from "../api/settingsQueries";
import { isPercent } from "../model/settingsMoney";
import type { SavingsProduct } from "../model/settingsTypes";

interface Props {
  products: SavingsProduct[];
  /** Holds the permission to ask for savings settings changes. */
  editable: boolean;
}

export function ProductsPanel({ products, editable }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SavingsProduct | null>(null);
  const [rate, setRate] = useState("");
  const [breakage, setBreakage] = useState("");

  const valid = editing !== null && isPercent(rate) && isPercent(breakage);

  /** Only the rates that differ from the live product, in the API's names. */
  function changes(product: SavingsProduct): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (Number(rate) !== product.interestPercent) out.interest_rate = Number(rate);
    if (Number(breakage) !== product.breakagePercent) {
      out.breakage_percentage_on_interest = Number(breakage);
    }
    return out;
  }

  return (
    <SectionCard
      title={t("savingsSettings.products.title")}
      description={t("savingsSettings.products.description")}
      flush
    >
      <SimpleTable<SavingsProduct>
        storageKey="savings-products"
        caption={t("savingsSettings.products.title")}
        rows={products}
        getRowId={(r) => r.code}
        columns={[
          { key: "name", header: t("savingsSettings.col.product"), cell: (r) => r.name },
          {
            key: "interest",
            header: t("savingsSettings.col.interest"),
            align: "right",
            cell: (r) => `${r.interestPercent}%`,
          },
          {
            key: "breakage",
            header: t("savingsSettings.col.breakage"),
            align: "right",
            cell: (r) => `${r.breakagePercent}%`,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              editable ? (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={t("savingsSettings.editNamed", { name: r.name })}
                  onClick={() => {
                    setRate(String(r.interestPercent));
                    setBreakage(String(r.breakagePercent));
                    setEditing(r);
                  }}
                >
                  <PencilSimple aria-hidden="true" />
                </Button>
              ) : null,
          },
        ]}
      />
      <p className="m-0 border-t border-border-soft px-4 py-3 text-xs text-muted-text">
        {t("savingsSettings.products.help")}
      </p>

      <ActionDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("savingsSettings.product.edit.title")}
        description={editing?.name}
        impact={t("savingsSettings.submit.impact")}
        confirmLabel={t("savingsSettings.submit")}
        blocked={!valid || !editing || Object.keys(changes(editing)).length === 0}
        onConfirm={async ({ reason }) => {
          if (editing) await requestProductChange(editing.code, changes(editing), reason);
          await queryClient.invalidateQueries({ queryKey: savingsSettingsKeys.all });
          return t("savingsSettings.submitted");
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-rate">{t("savingsSettings.field.interest")}</Label>
            <Input
              id="product-rate"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-breakage">{t("savingsSettings.field.breakage")}</Label>
            <Input
              id="product-breakage"
              inputMode="decimal"
              value={breakage}
              onChange={(event) => setBreakage(event.target.value)}
            />
          </div>
        </div>
        {(rate !== "" && !isPercent(rate)) || (breakage !== "" && !isPercent(breakage)) ? (
          <p role="alert" className="text-sm text-danger-text">
            {t("savingsSettings.err.percent")}
          </p>
        ) : null}
      </ActionDialog>
    </SectionCard>
  );
}
