import { useState } from "react";
import { TransactionsView, type TransactionFilterValues } from "./TransactionsView";

const INITIAL: TransactionFilterValues = {
  q: "",
  range: "90d",
  status: "all",
  purpose: "all",
  page: "1",
  limit: "10",
  sort: "",
  dir: "asc",
};

/** The Transactions list pre-filtered to one customer, for the Customer 360 tab. */
export function CustomerTransactionsPanel({ customerId }: { customerId: string }) {
  const [filters, setFilters] = useState(INITIAL);
  return (
    <TransactionsView
      customerId={customerId}
      filters={filters}
      defaults={INITIAL}
      setFilter={(key, value) =>
        setFilters((prev) => ({ ...prev, [key]: value, ...(key === "page" ? {} : { page: "1" }) }))
      }
      setFilters={(patch) =>
        setFilters((prev) => ({ ...prev, ...patch, ...("page" in patch ? {} : { page: "1" }) }))
      }
    />
  );
}
