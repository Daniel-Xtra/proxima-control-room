import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { t } from "../i18n/t";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
  };
  children?: ReactNode;
  actions?: ReactNode;
  /** Shows a "Clear filters" link, enabled only while a filter is active. */
  onClear?: () => void;
  dirty?: boolean;
}

/** A bordered panel of filters that sits above the table card. */
export function FilterBar({ search, children, actions, onClear, dirty }: FilterBarProps) {
  return (
    <div className="card mb-4 grid grid-cols-2 items-center gap-3 p-4 sm:flex sm:flex-wrap max-sm:[&>*]:min-w-0 max-sm:[&>*]:!w-full max-sm:[&>*]:!max-w-none [&_button[role=combobox]]:h-12">
      {search ? <DebouncedSearch {...search} /> : null}
      {children}
      {onClear ? (
        <Button variant="ghost" size="sm" disabled={!dirty} onClick={onClear}>
          {t("common.clearFilters")}
        </Button>
      ) : null}
      {actions ? (
        <div className="flex items-center gap-2 max-sm:col-span-2 sm:ml-auto">{actions}</div>
      ) : null}
    </div>
  );
}

function DebouncedSearch({
  value,
  onChange,
  placeholder,
  label,
}: NonNullable<FilterBarProps["search"]>) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number>(undefined);

  // Debounce at 300 ms: the URL only changes once typing pauses.
  function handleChange(next: string) {
    setDraft(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(next), 300);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="relative w-full max-w-xs min-w-56 flex-1 max-sm:col-span-2">
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        className="h-12 pr-12"
      />
      <MagnifyingGlass
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-text"
      />
    </div>
  );
}
