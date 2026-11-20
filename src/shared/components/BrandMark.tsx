import logo from "@/shared/assets/proxima-logo.svg";
import { cn } from "@/shared/lib/cn";

/** The Proxima logo. Decorative: the product name is always written next to it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img src={logo} alt="" aria-hidden="true" className={cn("h-8 w-auto shrink-0", className)} />
  );
}
