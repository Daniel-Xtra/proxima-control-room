import * as React from "react";
import { cn } from "@/shared/lib/cn";
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[108px] w-full rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
export { Textarea };
