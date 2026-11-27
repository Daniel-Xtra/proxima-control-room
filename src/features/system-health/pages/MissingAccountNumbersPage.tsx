import { ArrowClockwise } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DataTable } from "@/shared/components/DataTable";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatCard } from "@/shared/components/StatCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { NativeSelect } from "@/shared/components/ui/NativeSelect";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { formatCount, NO_VALUE } from "@/shared/lib/format";
import {
  listWalletsWithoutNumber,
  requestAccountNumber,
  type Readiness,
  type WalletWithoutNumber,
} from "../api/walletsApi";
import { WalletRowMenu } from "../components/WalletRowMenu";

const DEFAULTS = { readiness: "all", search: "", page: "1", limit: "10" };
const READINESS: Readiness[] = ["ready", "awaiting_kyc"];

export function MissingAccountNumbersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const can = useCan();
  const canRequest = can("customer:request_account_number");
  const [requesting, setRequesting] = useState<WalletWithoutNumber | null>(null);
  const [filters, setFilter, { setFilters }] = useUrlFilters(DEFAULTS);
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Number(filters.limit) || 10;
  const query = {
    readiness: filters.readiness === "all" ? undefined : (filters.readiness as Readiness),
    search: filters.search || undefined,
    page,
    limit,
  };
  const wallets = useApiQuery(
    ["system", "wallets-without-number", query],
    () => listWalletsWithoutNumber(query),
    { keepPreviousPage: true },
  );
  const counts = wallets.data?.counts;
  const count = (value: number | undefined) =>
    value === undefined ? NO_VALUE : formatCount(value);
  const dirty = filters.readiness !== "all" || filters.search !== "";
  const clear = () => setFilters({ readiness: "all", search: "" });
  const openCustomer = (wallet: WalletWithoutNumber) =>
    void navigate(`/customers/${wallet.customerId}`);

  return (
    <>
      <PageHeader
        title={t("wallets.title")}
        crumbs={[{ label: t("nav.group.system") }, { label: t("wallets.title") }]}
        description={t("wallets.description")}
        actions={
          <Button
            variant="outline"
            disabled={wallets.isFetching}
            onClick={() => void wallets.refetch()}
          >
            <ArrowClockwise aria-hidden="true" />
            {t("wallets.checkAgain")}
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("wallets.stat.missing")} value={count(counts?.missing)} />
        <StatCard
          label={t("wallets.status.ready")}
          value={count(counts?.ready)}
          tone={counts && counts.ready > 0 ? "warning" : "default"}
        />
        <StatCard label={t("wallets.status.awaiting_kyc")} value={count(counts?.awaitingKyc)} />
      </div>

      <FilterBar
        search={{
          value: filters.search,
          onChange: (value) => setFilter("search", value),
          placeholder: t("wallets.search"),
          label: t("wallets.search"),
        }}
        onClear={clear}
        dirty={dirty}
      >
        <NativeSelect
          aria-label={t("wallets.col.status")}
          className="w-56"
          value={filters.readiness}
          onChange={(event) => setFilter("readiness", event.target.value)}
        >
          <option value="all">{t("wallets.allStatuses")}</option>
          {READINESS.map((readiness) => (
            <option key={readiness} value={readiness}>
              {t(`wallets.status.${readiness}`)}
            </option>
          ))}
        </NativeSelect>
      </FilterBar>

      <SectionCard description={t("wallets.help")} flush>
        <AsyncBody
          query={wallets}
          isEmpty={(data) => data.total === 0}
          emptyTitle={t("wallets.empty")}
          filtered={dirty}
          onClearFilters={clear}
        >
          {(data) => (
            <DataTable<WalletWithoutNumber>
              storageKey="system-wallets-without-number"
              caption={t("wallets.title")}
              rows={data.rows}
              page={page}
              limit={limit}
              total={data.total}
              onPageChange={(next) => setFilters({ page: String(next) })}
              onLimitChange={(next) => setFilters({ limit: String(next) })}
              getRowId={(wallet) => String(wallet.walletId)}
              onRowOpen={openCustomer}
              hideOpenButton
              columns={[
                {
                  key: "customer",
                  header: t("wallets.col.customer"),
                  cell: (wallet) => wallet.customerName || NO_VALUE,
                },
                {
                  key: "phone",
                  header: t("customers.col.phone"),
                  cell: (wallet) => wallet.phone ?? NO_VALUE,
                },
                {
                  key: "level",
                  header: t("wallets.col.level"),
                  align: "right",
                  cell: (wallet) => formatCount(wallet.kycLevel),
                },
                {
                  key: "status",
                  header: t("wallets.col.status"),
                  cell: (wallet) => (
                    <StatusBadge
                      tone={wallet.ready ? "warning" : "neutral"}
                      label={t(`wallets.status.${wallet.ready ? "ready" : "awaiting_kyc"}`)}
                    />
                  ),
                },
                {
                  key: "record",
                  header: t("wallets.col.record"),
                  cell: (wallet) =>
                    wallet.recentlyRequested ? (
                      <StatusBadge tone="info" label={t("wallets.request.recent")} />
                    ) : (
                      t(wallet.incomplete ? "wallets.record.incomplete" : "wallets.record.none")
                    ),
                },
                {
                  key: "created",
                  header: t("wallets.col.created"),
                  cell: (wallet) => <DateText iso={wallet.walletCreatedAt} />,
                },
                {
                  key: "actions",
                  header: "",
                  alwaysVisible: true,
                  align: "right",
                  cell: (wallet) => (
                    <WalletRowMenu
                      name={wallet.customerName || String(wallet.walletId)}
                      onRequest={
                        canRequest && wallet.ready && !wallet.recentlyRequested
                          ? () => setRequesting(wallet)
                          : undefined
                      }
                      onOpenCustomer={() => openCustomer(wallet)}
                    />
                  ),
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <ActionDialog
        open={requesting !== null}
        onOpenChange={(open) => !open && setRequesting(null)}
        title={t("wallets.request.title")}
        description={requesting?.customerName || undefined}
        impact={t(
          requesting?.incomplete ? "wallets.request.impact.incomplete" : "wallets.request.impact",
        )}
        confirmLabel={t("wallets.request.title")}
        onConfirm={async ({ reason }) => {
          if (requesting) await requestAccountNumber(requesting.walletId, reason);
          await queryClient.invalidateQueries({ queryKey: ["system", "wallets-without-number"] });
          return t("wallets.request.done");
        }}
      />
    </>
  );
}
