import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/cn";
import { Input } from "./Input";
import { Popover, PopoverContent } from "./Popover";

export type ComboOption = { value: string; label: string };

/**
 * A text field that suggests values as you type. Anything can still be typed, so it suits
 * a free-text field with a few usual answers. It replaces the browser's own suggestion list.
 */
function ComboInput({
  value,
  onValueChange,
  options,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboOption[];
}) {
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const needle = value.trim().toLowerCase();
  const shown = options.filter(
    (o) => o.value.toLowerCase().includes(needle) || o.label.toLowerCase().includes(needle),
  );
  // Nothing to suggest once the field already holds exactly the only match.
  const exact = shown.length === 1 && shown[0].value === value;
  const visible = open && shown.length > 0 && !exact;

  function pick(option: ComboOption) {
    onValueChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) {
      if (event.key === "ArrowDown") setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + shown.length) % shown.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(shown[Math.min(active, shown.length - 1)]);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <Popover open={visible} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div>
          <Input
            {...props}
            ref={inputRef}
            value={value}
            autoComplete="off"
            aria-autocomplete="list"
            className={className}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              onValueChange(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverContent
        id={listId}
        className="dropdown-scroll max-h-60 w-[var(--radix-popper-anchor-width)] overflow-y-auto rounded-lg p-1"
        sideOffset={4}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault();
        }}
      >
        {shown.map((option, index) => (
          <button
            key={option.value}
            type="button"
            aria-current={option.value === value ? true : undefined}
            // Keep the focus in the field so typing carries on after a pick.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => pick(option)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-ink outline-none",
              index === active && "bg-surface-alt",
              option.value === value && "bg-info-bg",
            )}
          >
            <span className="truncate">{option.label}</span>
            {option.label !== option.value ? (
              <span className="shrink-0 text-xs text-muted-text">{option.value}</span>
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export { ComboInput };
