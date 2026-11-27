import { Check, X } from "@phosphor-icons/react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

/** The knob carries a tick (on) or a cross (off), so the state does not rest on colour. */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors data-[state=checked]:bg-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="flex size-4 items-center justify-center rounded-full bg-surface transition-transform data-[state=checked]:translate-x-4">
        <Check
          aria-hidden="true"
          weight="bold"
          className="hidden size-2.5 text-primary group-data-[state=checked]:block"
        />
        <X
          aria-hidden="true"
          weight="bold"
          className="size-2.5 text-muted-text group-data-[state=checked]:hidden"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
