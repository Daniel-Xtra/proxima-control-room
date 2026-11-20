import { request } from "./client";

export interface FilterOption {
  value: string;
  label: string;
}

/** The sets the server offers at `/admin/filters`. */
export type FilterName =
  | "transaction_purposes"
  | "transaction_statuses"
  | "transaction_directions"
  | "bill_types"
  | "bulk_transfer_statuses"
  | "bulk_item_statuses"
  | "approval_statuses"
  | "approval_types"
  | "overview_ranges"
  | "genders";

/** The choices behind filter dropdowns, as value and label pairs. Ask for only the sets a screen needs. */
export function getFilterOptions<N extends FilterName>(
  ...names: N[]
): Promise<Record<N, FilterOption[]>> {
  return request<Record<N, FilterOption[]>>("/admin/filters", {
    query: names.length ? { only: names.join(",") } : undefined,
  });
}
