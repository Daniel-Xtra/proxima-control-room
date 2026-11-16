import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AppIcon } from "@/shared/components/ui/AppIcon";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/components/ui/Button";
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-overlay duration-200 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Clicking the backdrop must not close a dialog; use the close button, Cancel or Escape.
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex min-h-0 w-full max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border/60 bg-card p-0 text-sm text-card-foreground duration-200 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-[30px] right-4 size-7 rounded-full bg-transparent p-0 hover:bg-transparent sm:top-[42px] sm:right-8"
            >
              <AppIcon icon="close" className="size-7" />
              <span className="sr-only">{t("common.close")}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "relative flex min-h-[88px] shrink-0 flex-col justify-center bg-muted px-4 py-5 pr-16 text-left sm:h-[112px] sm:px-8 sm:py-10 sm:pr-20",
        className,
      )}
      {...props}
    />
  );
}
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none] p-4 sm:p-6 lg:p-10",
        className,
      )}
      {...props}
    />
  );
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex w-full shrink-0 flex-col-reverse items-stretch gap-3 border-t-[0.5px] border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-8 [&_button]:h-14 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:basis-0 [&_button]:rounded-sm [&_button]:p-5 [&_button]:text-sm/[19.6px] [&_button]:font-semibold",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="ghost">{t("common.close")}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "mt-1 text-xs text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
