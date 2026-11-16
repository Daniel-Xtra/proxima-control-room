import { PageHeader } from "@/shared/components/PageHeader";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { t } from "@/shared/i18n/t";
import { TransactionsView } from "../components/TransactionsView";

const DEFAULTS = {
  q: "",
  range: "30d",
  status: "all",
  purpose: "all",
  page: "1",
  limit: "10",
  sort: "",
  dir: "asc",
};

export function TransactionsPage() {
  const [filters, setFilter] = useUrlFilters(DEFAULTS);
  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.description")}
        crumbs={[{ label: t("nav.group.customers") }, { label: t("transactions.title") }]}
      />
      <TransactionsView filters={filters} defaults={DEFAULTS} setFilter={setFilter} />
      <p className="mt-3 text-xs text-muted-text">{t("transactions.gap")}</p>
    </>
  );
}
