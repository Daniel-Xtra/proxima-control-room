import { Power } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { humanize } from "@/shared/lib/format";
import { requestFeeTurnOn } from "../api/configApi";
import { configKeys, useTurnedOffFees } from "../api/queries";
import type { TurnedOffFee } from "../model/types";

/** Fees that no longer apply, each with a way to ask for it again. */
export function TurnedOffFees({ editable }: { editable: boolean }) {
  const queryClient = useQueryClient();
  const result = useTurnedOffFees();
  const [turningOn, setTurningOn] = useState<TurnedOffFee | null>(null);

  return (
    <SectionCard
      title={t("config.fees.offList.title")}
      description={t("config.fees.offList.description")}
      flush
    >
      <AsyncBody
        query={result}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={t("config.fees.offList.empty")}
        emptyDescription={t("config.fees.offList.emptyDescription")}
      >
        {(rows) => (
          <SimpleTable<TurnedOffFee>
            caption={t("config.fees.offList.title")}
            rows={rows}
            getRowId={(r) => String(r.id)}
            columns={[
              {
                key: "name",
                header: t("config.col.service"),
                cell: (r) => (
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-text">{humanize(r.scope || r.code)}</p>
                  </div>
                ),
              },
              {
                key: "mode",
                header: t("config.col.type"),
                cell: (r) => t(`config.mode.${r.mode}`),
              },
              {
                key: "flat",
                header: t("config.col.flat"),
                align: "right",
                cell: (r) =>
                  r.flatKobo === null ? t("common.notAvailable") : <MoneyText kobo={r.flatKobo} />,
              },
              {
                key: "percent",
                header: t("config.col.percent"),
                align: "right",
                cell: (r) => (r.percent === null ? t("common.notAvailable") : `${r.percent}%`),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (r) =>
                  editable ? (
                    <Button
                      variant="outline"
                      aria-label={t("config.fees.on.named", { name: r.name })}
                      onClick={() => setTurningOn(r)}
                    >
                      <Power aria-hidden="true" />
                      {t("config.fees.on.button")}
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
      </AsyncBody>

      <ActionDialog
        open={turningOn !== null}
        onOpenChange={(open) => !open && setTurningOn(null)}
        title={t("config.fees.on.title")}
        description={turningOn?.name}
        impact={t("config.fees.on.impact")}
        confirmLabel={t("config.submit")}
        onConfirm={async ({ reason }) => {
          if (!turningOn) return "";
          await requestFeeTurnOn(turningOn.rule, reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return t("config.submitted");
        }}
      />
    </SectionCard>
  );
}
