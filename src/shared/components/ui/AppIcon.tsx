import { cn } from "@/shared/lib/cn";

// Icons copied from expentra-web's src/assets/icons. Decorative: always aria-hidden.
const modules = import.meta.glob("/src/shared/assets/icons/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export type AppIconName =
  | "shield-check"
  | "shield-check-error"
  | "settings"
  | "logout"
  | "upload-error"
  | "cloud-upload"
  | "upload-success"
  | "upload-retry"
  | "close";

export function AppIcon({ icon, className }: { icon: AppIconName; className?: string }) {
  return (
    <img
      src={modules[`/src/shared/assets/icons/${icon}.png`]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("block shrink-0 select-none", className)}
    />
  );
}
