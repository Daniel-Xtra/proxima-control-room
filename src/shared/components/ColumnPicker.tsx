import { Columns } from "@phosphor-icons/react";
import { t } from "../i18n/t";
import type { Column } from "./SimpleTable";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

interface ColumnPickerProps<T> {
  columns: Column<T>[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
}

/** "Columns" menu: choose which columns the table shows. The first column always stays. */
export function ColumnPicker<T>({ columns, hidden, onToggle, onReset }: ColumnPickerProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns aria-hidden="true" />
          {t("table.columns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* A column with no header holds row actions, so there is nothing to name in this menu. */}
        {columns
          .filter((col) => col.header !== "")
          .map((col, index) => (
            <DropdownMenuCheckboxItem
              key={col.key}
              checked={!hidden.has(col.key)}
              disabled={index === 0 || col.alwaysVisible}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => onToggle(col.key)}
            >
              {col.header}
            </DropdownMenuCheckboxItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={hidden.size === 0} onSelect={onReset}>
          {t("table.columns.reset")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
