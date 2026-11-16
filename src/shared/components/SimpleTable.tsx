import { ArrowSquareOut, CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import { t } from "../i18n/t";
import { cn } from "../lib/cn";
import { Button } from "./ui/Button";
import { compareValues, nextSort, type SortState } from "./tableSort";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/Table";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Client-side sorting: the value rows are ordered by. */
  sortValue?: (row: T) => string | number;
  /** Server-side sorting: the key sent to the API. Used when the table is controlled. */
  sortKey?: string;
  /** Columns that must stay visible in the column picker. */
  alwaysVisible?: boolean;
}

interface SimpleTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowOpen?: (row: T) => void;
  caption: string;
  /** Controlled sort, for server-side sorting. Omit to sort rows in the browser. */
  sort?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
  hiddenKeys?: ReadonlySet<string>;
}

export function SimpleTable<T>({
  columns,
  rows,
  getRowId,
  onRowOpen,
  caption,
  sort,
  onSortChange,
  hiddenKeys,
}: SimpleTableProps<T>) {
  const controlled = onSortChange !== undefined;
  const [localSort, setLocalSort] = useState<SortState | null>(null);
  const active = controlled ? (sort ?? null) : localSort;

  const visible = columns.filter((col) => !hiddenKeys?.has(col.key));
  const sortId = (col: Column<T>) => (controlled ? (col.sortKey ?? col.key) : col.key);
  const isSortable = (col: Column<T>) => (controlled ? col.sortKey !== undefined : !!col.sortValue);

  const ordered = useMemo(() => {
    if (controlled || !localSort) return rows;
    const col = columns.find((c) => c.key === localSort.key);
    if (!col?.sortValue) return rows;
    const value = col.sortValue;
    const factor = localSort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compareValues(value(a), value(b)));
  }, [columns, controlled, localSort, rows]);

  function toggle(col: Column<T>) {
    const next = nextSort(active, sortId(col));
    if (controlled) onSortChange(next);
    else setLocalSort(next);
  }

  return (
    // The wrapper scrolls sideways only, so the table never grows its own vertical scrollbar.
    <div className="relative w-full overflow-x-auto overflow-y-hidden">
      <Table container={false}>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="border-b border-border-soft hover:bg-transparent">
            {visible.map((col) => {
              const sortable = isSortable(col);
              const direction = active?.key === sortId(col) ? active.dir : null;
              return (
                <TableHead
                  key={col.key}
                  scope="col"
                  aria-sort={
                    !sortable
                      ? undefined
                      : direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : "none"
                  }
                  className={cn(col.align === "right" ? "text-right" : "text-left", col.className)}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(col)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 hover:text-ink",
                        direction && "text-ink",
                      )}
                    >
                      {col.header}
                      {direction === "asc" ? (
                        <CaretUp aria-hidden="true" size={10} weight="bold" />
                      ) : direction === "desc" ? (
                        <CaretDown aria-hidden="true" size={10} weight="bold" />
                      ) : (
                        <CaretUpDown aria-hidden="true" size={10} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
            {onRowOpen ? (
              <TableHead scope="col" className="w-12">
                <span className="sr-only">{t("table.rowActions")}</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((row) => (
            <TableRow
              key={getRowId(row)}
              className={cn(
                "border-b border-border-soft last:border-b-0",
                onRowOpen && "cursor-pointer",
              )}
              onDoubleClick={onRowOpen ? () => onRowOpen(row) : undefined}
            >
              {visible.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "text-body",
                    col.align === "right" && "text-right tabular-nums",
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </TableCell>
              ))}
              {onRowOpen ? (
                <TableCell className="w-12 text-right">
                  {/* The same "open" icon button the reference uses to reach a record's detail. */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("table.open")}: ${getRowId(row)}`}
                    title={t("table.open")}
                    onClick={() => onRowOpen(row)}
                  >
                    <ArrowSquareOut size={16} aria-hidden="true" />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
