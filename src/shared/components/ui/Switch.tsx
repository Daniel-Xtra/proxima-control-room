import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors data-[state=checked]:bg-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-surface transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
