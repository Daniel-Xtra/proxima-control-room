import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { t } from "../i18n/t";
import { ColumnPicker } from "./ColumnPicker";
import { SimpleTable, type Column } from "./SimpleTable";
import type { SortState } from "./tableSort";
import { Button } from "./ui/Button";
import { NativeSelect } from "./ui/NativeSelect";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  caption: string;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Rows per page chosen in the footer. Changing it returns to page 1. */
  onLimitChange: (limit: number) => void;
  onRowOpen?: (row: T) => void;
  /** Extra buttons in the toolbar, beside the column picker (for example Export). */
  toolbarExtra?: ReactNode;
  /** Where the hidden-column choice is remembered. */
  storageKey: string;
  /** Below 1024px rows show as cards. Set false to keep a real table that scrolls sideways. */
  cardsOnSmall?: boolean;
  /** Leave both out for tables whose API cannot sort. */
  sort?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
}

/** Server-side paginated and sorted table with a column picker and a Previous/Next footer. */
export function DataTable<T>({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  toolbarExtra,
  storageKey,
  ...tableProps
}: DataTableProps<T>) {
  const { hidden, toggle, reset } = useColumnVisibility(storageKey);
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border-soft px-4 py-2">
        {toolbarExtra}
        <ColumnPicker
          columns={tableProps.columns}
          hidden={hidden}
          onToggle={toggle}
          onReset={reset}
        />
      </div>
      <SimpleTable hiddenKeys={hidden} {...tableProps} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-text">
          <label htmlFor="rows-per-page">{t("table.perPage")}</label>
          <NativeSelect
            id="rows-per-page"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="w-20"
          >
            {[...new Set([5, 10, 25, 50, limit])]
              .sort((a, b) => a - b)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-text">{t("table.showing", { from, to, total })}</span>
          {pages > 1 ? (
            <span className="text-xs text-muted-text">{t("table.page", { page, pages })}</span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <CaretLeft aria-hidden="true" size={12} />
            {t("table.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            {t("table.next")}
            <CaretRight aria-hidden="true" size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}
