import { NavLink } from "react-router-dom";
import { useCan } from "@/features/auth";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { useAwaitingUpgradeCount } from "../api/queries";

const TAB =
  "relative -mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap";

/** The customer directory, and the customers whose documents are waiting for a tier upgrade review. */
export function CustomerAreaTabs({ current }: { current: "customers" | "upgrades" }) {
  const can = useCan();
  const canSeeUpgrades = can("kyc:view");
  const awaiting = useAwaitingUpgradeCount(canSeeUpgrades).data ?? 0;
  if (!canSeeUpgrades) return null;

  const link = (to: string, id: typeof current, label: string, count = 0) => (
    <NavLink
      to={to}
      end
      aria-current={current === id ? "page" : undefined}
      className={cn(
        TAB,
        current === id
          ? "border-primary text-primary"
          : "border-transparent text-muted-text hover:text-ink",
      )}
    >
      {label}
      {count > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-on-ink">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </NavLink>
  );

  return (
    <nav
      aria-label={t("customers.title")}
      className="mb-5 flex items-end gap-6 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {link("/customers", "customers", t("customers.all"))}
      {link("/customers/upgrade-requests", "upgrades", t("customers.nav.requests"), awaiting)}
    </nav>
  );
}
