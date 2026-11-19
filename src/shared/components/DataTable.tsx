import { ArrowLeft, ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
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
  /** Page numbers between Previous and Next, without the toolbar and the rows-per-page choice. The page supplies those. */
  numbered?: boolean;
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
  numbered = false,
  ...tableProps
}: DataTableProps<T>) {
  const { hidden, toggle, reset } = useColumnVisibility(storageKey);
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div>
      <div
        className={`flex flex-wrap items-center justify-end gap-2 border-b border-border-soft px-4 py-2 ${numbered ? "hidden" : ""}`}
      >
        {toolbarExtra}
        <div className={tableProps.cardsOnSmall === false ? undefined : "hidden lg:block"}>
          <ColumnPicker
            columns={tableProps.columns}
            hidden={hidden}
            onToggle={toggle}
            onReset={reset}
          />
        </div>
      </div>
      <SimpleTable hiddenKeys={hidden} {...tableProps} />
      {numbered ? <NumberedFooter page={page} pages={pages} onPageChange={onPageChange} /> : null}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-3 ${numbered ? "hidden" : ""}`}
      >
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

/** 1 2 3 … 8 9 10: the ends, and the pages around the current one. */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((n) => wanted.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2].forEach((n) => wanted.add(n));
  const sorted = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1]! > 1 ? ["gap" as const, n] : [n]));
}

function NumberedFooter({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      aria-label={t("table.pagination")}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-border-soft px-4 py-3"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ArrowLeft aria-hidden="true" size={14} />
        {t("table.prev")}
      </Button>
      <ul className="m-0 hidden list-none items-center justify-center gap-1 p-0 sm:flex">
        {pageWindow(page, pages).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-muted-text">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                aria-label={t("table.goTo", { page: entry })}
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onPageChange(entry)}
                className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-sm tabular-nums hover:bg-surface-muted ${
                  entry === page ? "bg-surface-muted font-medium text-ink" : "text-muted-text"
                }`}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ul>
      <span className="text-center text-xs text-muted-text sm:hidden">
        {t("table.page", { page, pages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        {t("table.nextShort")}
        <ArrowRight aria-hidden="true" size={14} />
      </Button>
    </nav>
  );
}
