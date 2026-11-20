import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useCan } from "@/features/auth";
import {
  CustomerRequestsPanel,
  RequestFreezeDialog,
  RequestLimitDialog,
} from "@/features/requests";
import { CustomerActivityPanel } from "@/features/risk";
import { CustomerSavingsPanel } from "@/features/savings";
import { CustomerTransactionsPanel, StatementDialog } from "@/features/transactions";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { useCustomer } from "../api/queries";
import {
  RepairBankOneDialog,
  ResetPasswordDialog,
  UnlockLoginDialog,
} from "../components/CustomerActionDialogs";
import { CustomerActivity } from "../components/CustomerActivity";
import { CustomerHeader } from "../components/CustomerHeader";
import { CustomerKycTab } from "../components/CustomerKycTab";
import { CustomerSecurityTab } from "../components/CustomerSecurityTab";
import { CustomerSummaryTab } from "../components/CustomerSummaryTab";
import type { Customer } from "../model/types";

const TABS = [
  "summary",
  "kyc",
  "transactions",
  "savings",
  "security",
  "requests",
  "activity",
] as const;
type DialogId = "freeze" | "limit" | "reset" | "unlock" | "repair" | "statement" | null;

export function CustomerDetailPage() {
  const { id = "" } = useParams();
  const query = useCustomer(id);

  return (
    <AsyncBody query={query}>{(customer) => <CustomerDetail customer={customer} />}</AsyncBody>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<DialogId>(null);
  const requested = params.get("tab");
  const tab = TABS.find((candidate) => candidate === requested) ?? "summary";
  const frozen = customer.status === "frozen";
  const close = (open: boolean) => !open && setDialog(null);

  const actions: { id: Exclude<DialogId, null>; label: string; allowed: boolean }[] = [
    {
      id: "freeze",
      label: frozen ? t("customers.action.requestUnfreeze") : t("customers.action.requestFreeze"),
      allowed: can(frozen ? "unfreeze_request:initiate" : "freeze_request:initiate"),
    },
    {
      id: "limit",
      label: t("customers.action.requestLimit"),
      allowed: can("limit_request:initiate"),
    },
    {
      id: "reset",
      label: t("customers.action.resetPassword"),
      allowed: can("customer:reset_password"),
    },
    { id: "unlock", label: t("customers.action.unlock"), allowed: can("customer:unlock") },
    {
      id: "repair",
      label: t("customers.action.repairBankOne"),
      allowed: can("customer:repair_bankone"),
    },
    { id: "statement", label: t("customers.action.statement"), allowed: can("customer:export") },
  ];
  const available = actions.filter((action) => action.allowed);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("nav.group.customers") },
          { label: t("customers.title"), to: "/customers" },
          { label: customer.name },
        ]}
        title={t("customers.title")}
        hideTitle
      />

      <CustomerHeader
        customer={customer}
        onMoreInfo={() => setParams({ tab: "summary" }, { replace: true })}
        actions={
          available.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  {t("customers.actions")}
                  <CaretDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {available.map((action) => (
                  <DropdownMenuItem key={action.id} onSelect={() => setDialog(action.id)}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />

      <CustomerActivity customer={customer} />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          {TABS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {t(`customers.tab.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="summary">
          <CustomerSummaryTab customer={customer} />
        </TabsContent>
        <TabsContent value="kyc">
          <CustomerKycTab customer={customer} />
        </TabsContent>
        <TabsContent value="transactions">
          <CustomerTransactionsPanel customerId={customer.id} />
        </TabsContent>
        <TabsContent value="savings">
          <CustomerSavingsPanel customerId={customer.id} />
        </TabsContent>
        <TabsContent value="security">
          <CustomerSecurityTab customer={customer} />
        </TabsContent>
        <TabsContent value="requests">
          <CustomerRequestsPanel customerId={customer.id} freezeHistory={customer.freezeHistory} />
        </TabsContent>
        <TabsContent value="activity">
          <CustomerActivityPanel customerId={customer.id} />
        </TabsContent>
      </Tabs>

      <RequestFreezeDialog
        open={dialog === "freeze"}
        onOpenChange={close}
        customer={{ id: customer.id, name: customer.name, frozen }}
      />
      <RequestLimitDialog
        open={dialog === "limit"}
        onOpenChange={close}
        customer={{
          id: customer.id,
          name: customer.name,
          dailyLimitKobo: customer.dailyLimitKobo,
          perTransactionLimitKobo: customer.perTransactionLimitKobo,
        }}
      />
      <ResetPasswordDialog open={dialog === "reset"} onOpenChange={close} customer={customer} />
      <UnlockLoginDialog open={dialog === "unlock"} onOpenChange={close} customer={customer} />
      <RepairBankOneDialog open={dialog === "repair"} onOpenChange={close} customer={customer} />
      <StatementDialog
        open={dialog === "statement"}
        onOpenChange={close}
        customerId={customer.id}
        customerName={customer.name}
      />
    </>
  );
}
