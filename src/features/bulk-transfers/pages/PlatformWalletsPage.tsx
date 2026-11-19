import { ArrowFatLinesUp } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { requestWalletTopUp } from "../api/bulkApi";
import { bulkKeys, usePlatformWallets } from "../api/queries";
import type { PlatformWallet } from "../model/types";

const isAmount = (text: string) => /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0;

/** The wallets bulk transfers pay from. Topping one up is a request that another admin approves. */
export function PlatformWalletsPage() {
  const queryClient = useQueryClient();
  const result = usePlatformWallets();
  const [target, setTarget] = useState<PlatformWallet | null>(null);
  const [amount, setAmount] = useState("");

  const close = () => {
    setTarget(null);
    setAmount("");
  };

  return (
    <>
      <PageHeader
        title={t("wallets.title")}
        description={t("wallets.description")}
        crumbs={[{ label: t("nav.group.payments") }, { label: t("wallets.title") }]}
      />
      <SectionCard flush>
        <AsyncBody
          query={result}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("wallets.empty.title")}
          emptyDescription={t("wallets.empty.description")}
        >
          {(rows) => (
            <SimpleTable<PlatformWallet>
              caption={t("wallets.title")}
              rows={rows}
              getRowId={(row) => row.id}
              columns={[
                {
                  key: "name",
                  header: t("wallets.col.name"),
                  cell: (row) => <span className="font-medium">{row.name}</span>,
                },
                {
                  key: "balance",
                  header: t("wallets.col.balance"),
                  align: "right",
                  cell: (row) => <MoneyText kobo={row.balanceKobo} />,
                },
                {
                  key: "status",
                  header: t("wallets.col.status"),
                  cell: (row) => (
                    <StatusBadge
                      tone={row.enabled ? "success" : "neutral"}
                      label={
                        row.enabled ? t("wallets.status.active") : t("wallets.status.disabled")
                      }
                    />
                  ),
                },
                {
                  key: "actions",
                  header: t("wallets.col.actions"),
                  align: "right",
                  cell: (row) => (
                    <Can permission="platform_wallet:topup_request">
                      <Button variant="outline" size="sm" onClick={() => setTarget(row)}>
                        <ArrowFatLinesUp aria-hidden="true" />
                        {t("wallets.topUp")}
                      </Button>
                    </Can>
                  ),
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <ActionDialog
        open={target !== null}
        onOpenChange={(open) => !open && close()}
        title={t("wallets.topUp.title")}
        description={target?.name}
        impact={t("wallets.topUp.impact")}
        confirmLabel={t("wallets.topUp.submit")}
        blocked={!isAmount(amount)}
        onConfirm={async ({ reason }) => {
          if (!target) return "";
          await requestWalletTopUp(target.id, Number(amount), reason);
          await queryClient.invalidateQueries({ queryKey: bulkKeys.wallets });
          return t("wallets.topUp.done");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wallet-topup-amount">{t("wallets.topUp.amount")}</Label>
          <Input
            id="wallet-topup-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[₦,\s]/g, ""))}
          />
        </div>
      </ActionDialog>
    </>
  );
}
