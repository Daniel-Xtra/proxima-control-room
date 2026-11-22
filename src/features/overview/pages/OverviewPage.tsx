import { useState } from "react";
import { Link } from "react-router-dom";
import { useCan, useCurrentUser } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { PageHeader } from "@/shared/components/PageHeader";
import { RangeFilter } from "@/shared/components/RangeFilter";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { SavingsCard } from "../components/SavingsCard";
import { StatusCard } from "../components/StatusCard";
import { SummaryCards } from "../components/SummaryCards";
import { TrendCard } from "../components/TrendCard";

const DEFAULTS = { range: "30d" };

/** The server refuses a custom period longer than this many days (MAX_CUSTOM_DAYS), so the picker does not offer one. */
const MAX_CUSTOM_DAYS = 366;

/** The time of day in Lagos picks the wording and the emoji. */
function greetingFor(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(now),
  );
  if (hour < 12) return { key: "overview.greeting.morning", emoji: "☀️" } as const;
  if (hour < 17) return { key: "overview.greeting.afternoon", emoji: "🌤️" } as const;
  return { key: "overview.greeting.evening", emoji: "🌙" } as const;
}

/**
 * The dashboard is made of sections that load on their own. The "Showing" period applies to the cards at the top only; the
 * chart and the status card keep their own periods, and the savings card has none.
 */
export function OverviewPage() {
  const can = useCan();
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  const pending = usePendingRequestCount(can("request:view_all"));
  const user = useCurrentUser();
  const [greeting] = useState(() => greetingFor(new Date()));
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <>
      <PageHeader
        title={`${t(greeting.key, { name: firstName })} ${greeting.emoji}`}
        description={t("overview.welcome")}
        crumbs={[{ label: t("overview.crumb") }, { label: t("overview.title") }]}
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-text">
            <span>{t("overview.showing")}</span>
            <RangeFilter
              label={t("overview.range")}
              value={filters.range}
              onChange={(v) => setFilter("range", v)}
              maxSpanDays={MAX_CUSTOM_DAYS}
              options={[
                ["7d", t("range.7d")],
                ["30d", t("range.30d")],
                ["90d", t("range.90d")],
              ]}
            />
          </div>
        }
      />

      {can("request:view_all") ? (
        <Link
          to="/requests"
          className="card mb-4 flex items-center justify-between px-4 py-3 text-sm text-ink hover:bg-surface-muted"
        >
          <span>{t("overview.attention.approvals")}</span>
          <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning-text">
            {pending.data ?? "–"}
          </span>
        </Link>
      ) : null}

      <div className="flex flex-col gap-4">
        <SummaryCards range={filters.range} />
        <TrendCard />
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StatusCard />
          </div>
          <SavingsCard />
        </div>
      </div>
    </>
  );
}
