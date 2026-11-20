import * as React from "react";
import { cn } from "@/shared/lib/cn";
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
export { Input };
