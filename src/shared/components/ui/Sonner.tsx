import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/shared/lib/cn";
import { useTheme } from "@/shared/lib/theme";

/**
 * A quiet card: an edge in the tone's colour, one plain icon and the message. The kind of message is never shown by
 * colour alone, because each kind has its own icon shape.
 */
function Toaster({ className, toastOptions, icons, ...props }: ToasterProps) {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      className={cn("toaster group", className)}
      position="top-right"
      closeButton
      expand
      visibleToasts={3}
      gap={8}
      duration={4000}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      icons={{
        success: (
          <CheckCircleIcon className="size-5 text-success-solid" weight="fill" aria-hidden />
        ),
        error: <WarningCircleIcon className="size-5 text-danger" weight="fill" aria-hidden />,
        warning: <WarningIcon className="size-5 text-warning-text" weight="fill" aria-hidden />,
        info: <InfoIcon className="size-5 text-info-text" weight="fill" aria-hidden />,
        close: <XIcon className="size-3.5" weight="bold" aria-hidden />,
        ...icons,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Close notification",
        ...toastOptions,
        classNames: {
          toast:
            "!items-center !gap-3 !rounded-lg !border !border-l-4 !border-border !bg-surface !py-3.5 !pl-3.5 !pr-11 !text-ink !shadow-overlay sm:!w-[360px]",
          success: "!border-l-success-solid",
          error: "!border-l-danger",
          warning: "!border-l-warning-text",
          info: "!border-l-info-text",
          icon: "!m-0 !size-5 !shrink-0 !justify-center",
          content: "!gap-0.5",
          title: "!text-sm !font-medium !leading-5 !text-ink",
          description: "!text-xs !leading-5 !text-muted-text",
          closeButton:
            "!left-auto !right-2.5 !top-1/2 !size-6 !translate-x-0 !-translate-y-1/2 !transform-none !rounded-md !border-0 !bg-transparent !text-muted-text !transition-colors hover:!bg-surface-alt hover:!text-ink",
          actionButton: "!rounded-md !bg-ink !px-2.5 !text-xs !font-medium !text-surface",
          cancelButton: "!rounded-md !bg-surface-alt !px-2.5 !text-xs !font-medium !text-ink",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
