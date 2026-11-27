import { ArrowSquareOut, CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { t } from "../i18n/t";
import { ColumnPicker } from "./ColumnPicker";
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
  /** The column that titles a row when the table shows as cards on a phone. Defaults to the first one. */
  primary?: boolean;
}

interface SimpleTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowOpen?: (row: T) => void;
  /** For rows whose own menu opens them. Double-clicking still opens the row. */
  hideOpenButton?: boolean;
  caption: string;
  /** Controlled sort, for server-side sorting. Omit to sort rows in the browser. */
  sort?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
  hiddenKeys?: ReadonlySet<string>;
  /** Shows a Columns menu above the table and remembers the choice under this key. */
  storageKey?: string;
  /** Below 1024px rows show as cards. Set false to keep a real table that scrolls sideways (for example a list of payees). */
  cardsOnSmall?: boolean;
}

export function SimpleTable<T>({
  columns,
  rows,
  getRowId,
  onRowOpen,
  hideOpenButton = false,
  caption,
  sort,
  onSortChange,
  hiddenKeys,
  storageKey,
  cardsOnSmall = true,
}: SimpleTableProps<T>) {
  const controlled = onSortChange !== undefined;
  const [localSort, setLocalSort] = useState<SortState | null>(null);
  const active = controlled ? (sort ?? null) : localSort;

  const saved = useColumnVisibility(storageKey ?? "");
  const hidden = storageKey ? saved.hidden : hiddenKeys;
  const visible = columns.filter((col) => !hidden?.has(col.key));
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

  // Row ids can repeat (a fee row shares its transaction's reference). React needs each key once, or it keeps the
  // wrong rows on screen when the list changes, so a repeated id gets a number.
  const rowKeys = useMemo(() => {
    const seen = new Map<string, number>();
    return new Map(
      ordered.map((row) => {
        const id = getRowId(row);
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        return [row, count === 0 ? id : `${id}~${count}`] as const;
      }),
    );
  }, [ordered, getRowId]);

  function toggle(col: Column<T>) {
    const next = nextSort(active, sortId(col));
    if (controlled) onSortChange(next);
    else setLocalSort(next);
  }

  const openButton = onRowOpen && !hideOpenButton;

  // On a phone a row becomes a card: the first column leads, the rest are label and value pairs, and columns with no header
  // (row actions) sit at the bottom. This keeps every value readable without scrolling sideways.
  const labelled = visible.filter((col) => col.header !== "");
  const actionCols = visible.filter((col) => col.header === "");
  const lead = labelled.find((col) => col.primary) ?? labelled[0];
  const rest = labelled.filter((col) => col !== lead);
  const cards = (
    <ul aria-label={caption} className="m-0 list-none divide-y divide-border-soft p-0 lg:hidden">
      {ordered.map((row) => (
        <li key={rowKeys.get(row)} className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 break-words font-medium text-ink">{lead?.cell(row)}</div>
            {openButton ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t("table.open")}: ${getRowId(row)}`}
                title={t("table.open")}
                onClick={() => onRowOpen?.(row)}
              >
                <ArrowSquareOut size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          {rest.length > 0 ? (
            <dl className="m-0 grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
              {rest.map((col) => (
                <Fragment key={col.key}>
                  <dt className="text-muted-text">{col.header}</dt>
                  <dd
                    className={cn(
                      "m-0 min-w-0 break-words text-ink",
                      col.align === "right" && "tabular-nums",
                    )}
                  >
                    {col.cell(row)}
                  </dd>
                </Fragment>
              ))}
            </dl>
          ) : null}
          {actionCols.length > 0 ? (
            <div className="flex items-center justify-end gap-1">
              {actionCols.map((col) => (
                <Fragment key={col.key}>{col.cell(row)}</Fragment>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  const table = (
    // The wrapper scrolls sideways only, so the table never grows its own vertical scrollbar.
    <div
      className={cn(
        "relative w-full overflow-x-auto overflow-y-hidden",
        cardsOnSmall && "hidden lg:block",
      )}
    >
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
            {openButton ? (
              <TableHead scope="col" className="w-12">
                <span className="sr-only">{t("table.rowActions")}</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((row) => (
            <TableRow
              key={rowKeys.get(row)}
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
              {openButton ? (
                <TableCell className="w-12 text-right">
                  {/* The same "open" icon button the reference uses to reach a record's detail. */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`${t("table.open")}: ${getRowId(row)}`}
                    title={t("table.open")}
                    onClick={() => onRowOpen?.(row)}
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

  const body = (
    <>
      {cardsOnSmall ? cards : null}
      {table}
    </>
  );
  if (!storageKey) return body;
  return (
    <div>
      <div className="flex justify-end border-b border-border-soft px-4 py-2">
        <ColumnPicker
          columns={columns}
          hidden={saved.hidden}
          onToggle={saved.toggle}
          onReset={saved.reset}
        />
      </div>
      {body}
    </div>
  );
}
