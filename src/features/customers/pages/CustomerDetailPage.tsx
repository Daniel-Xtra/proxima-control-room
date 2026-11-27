import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
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
import { ResetPasswordDialog, UnlockLoginDialog } from "../components/CustomerActionDialogs";
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
type DialogId = "freeze" | "limit" | "reset" | "unlock" | "statement" | null;

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
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Keeps the open tab in the middle of the row, so it is never off the side of a narrow screen. Only the row moves.
  useEffect(() => {
    const list = tabListRef.current;
    const active = list?.querySelector('[data-state="active"]');
    if (!list || !active) return;
    const row = list.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    list.scrollLeft += item.left - row.left - (row.width - item.width) / 2;
  }, [tab]);

  // A count, so that asking again while already on the tab scrolls again.
  const [infoRequests, setInfoRequests] = useState(0);
  const scrollPending = useRef(false);

  const showMoreInfo = () => {
    scrollPending.current = true;
    setInfoRequests((count) => count + 1);
    setParams({ tab: "summary" }, { replace: true });
  };

  // Runs once the tab is on screen: scrolling sooner measures the page at the previous tab's height.
  useEffect(() => {
    if (!scrollPending.current || tab !== "summary") return;
    scrollPending.current = false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tabsRef.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  }, [infoRequests, tab]);

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
        onMoreInfo={showMoreInfo}
        actions={
          available.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="max-sm:w-full">
                  {t("customers.actions")}
                  <CaretDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              {/* On a phone the button spans the screen, so the menu matches it and its rows are tall enough to tap. */}
              <DropdownMenuContent
                align="end"
                collisionPadding={16}
                className="max-sm:w-(--radix-dropdown-menu-trigger-width)"
              >
                {available.map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    className="max-sm:py-3"
                    onSelect={() => setDialog(action.id)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />

      <CustomerActivity customer={customer} />

      {/* The top margin keeps the tab names clear of the fixed header when scrolled to. */}
      <div ref={tabsRef} className="scroll-mt-20" />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        {/* One row that scrolls sideways when the screen is too narrow for every name. */}
        <TabsList ref={tabListRef} className="max-sm:[scrollbar-width:none]!">
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
      <StatementDialog
        open={dialog === "statement"}
        onOpenChange={close}
        customerId={customer.id}
        customerName={customer.name}
      />
    </>
  );
}
