import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/Sheet";
import { cn } from "@/shared/lib/cn";

const SIZE = {
  md: "w-full sm:max-w-lg",
  lg: "w-full sm:max-w-2xl",
  xl: "w-full sm:max-w-2xl lg:max-w-4xl",
} as const;

type DetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Optional actions shown in the header (edit, retry, …). */
  action?: ReactNode;
  size?: keyof typeof SIZE;
  children: ReactNode;
};

/** Right-side detail drawer for list → detail flows. Body scrolls; header stays put. */
export function DetailsSheet({
  open,
  onOpenChange,
  title,
  description,
  action,
  size = "lg",
  children,
}: DetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("gap-0 p-0", SIZE[size])}>
        <SheetHeader className="shrink-0 border-b border-border-soft pr-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </div>
            {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
