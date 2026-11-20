import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { useOverviewSavings } from "../api/queries";
import { ZERO_SAVINGS, orZeros } from "../api/zeros";
import { OfflineNote } from "./OfflineNote";

/** What customers hold in fixed deposits and target savings right now. It has no period. */
export function SavingsCard() {
  const live = useOverviewSavings();
  const { query, offline } = orZeros(live, ZERO_SAVINGS);

  return (
    <SectionCard title={t("overview.savings.title")}>
      {offline ? <OfflineNote onRetry={() => void live.refetch()} /> : null}
      <AsyncBody query={query} skeletonRows={2}>
        {(savings) => (
          <dl className="m-0 flex flex-col gap-4">
            <div>
              <dt className="text-sm text-muted-text">
                {t("overview.savings.fixed", { count: formatCount(savings.fixedCount) })}
              </dt>
              <dd className="m-0 text-xl font-semibold text-ink">
                <MoneyText kobo={savings.fixedTotalKobo} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-text">
                {t("overview.savings.target", { count: formatCount(savings.targetCount) })}
              </dt>
              <dd className="m-0 text-xl font-semibold text-ink">
                <MoneyText kobo={savings.targetTotalKobo} />
              </dd>
            </div>
          </dl>
        )}
      </AsyncBody>
    </SectionCard>
  );
}
