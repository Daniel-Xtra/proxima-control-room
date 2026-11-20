import * as React from "react";
import { cn } from "@/shared/lib/cn";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";

// Radix does not allow an empty-string item value, so the "no filter" option travels under a placeholder value.
const EMPTY = "__empty__";

type Opt = { value: string; disabled?: boolean; label: React.ReactNode };

const textOf = (n: React.ReactNode): string =>
  typeof n === "string" || typeof n === "number"
    ? String(n)
    : Array.isArray(n)
      ? n.map(textOf).join("")
      : "";

/** Flatten <option> children (arrays, fragments, conditionals) into plain option data. */
function readOptions(children: React.ReactNode): Opt[] {
  const out: Opt[] = [];
  React.Children.forEach(children, (c) => {
    if (!React.isValidElement(c)) return;
    const el = c as React.ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: React.ReactNode;
    }>;
    if (el.type === React.Fragment) out.push(...readOptions(el.props.children));
    else if (el.type === "option")
      out.push({
        value: el.props.value === undefined ? textOf(el.props.children) : String(el.props.value),
        disabled: el.props.disabled,
        label: el.props.children,
      });
  });
  return out;
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

/**
 * Dropdown in expentra-web's style: a custom list with the chosen row highlighted and ticked.
 * Same props as a native select (value, onChange(e), <option> children), so screens did not need rewriting.
 */
export const NativeSelect = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      onChange,
      id,
      name,
      disabled,
      required,
      "aria-label": ariaLabel,
      "aria-invalid": invalid,
      "aria-describedby": describedBy,
    },
    ref,
  ) => {
    const options = React.useMemo(() => readOptions(children), [children]);
    const current = value === undefined ? undefined : String(value);
    const shown = current === "" ? EMPTY : current;
    return (
      <SelectRoot
        value={shown}
        name={name}
        required={required}
        disabled={disabled}
        onValueChange={(v) => {
          const val = v === EMPTY ? "" : v;
          onChange?.({
            target: { value: val, id, name },
            currentTarget: { value: val, id, name },
          } as unknown as React.ChangeEvent<HTMLSelectElement>);
        }}
      >
        <SelectTrigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn("data-[size=default]:h-10", className)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value === "" ? EMPTY : o.value}
              disabled={o.disabled}
              className="font-normal normal-case"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    );
  },
);
NativeSelect.displayName = "NativeSelect";
