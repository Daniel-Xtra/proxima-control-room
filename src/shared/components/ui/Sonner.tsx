import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/shared/lib/cn";
import { useTheme } from "@/shared/lib/theme";

/** The icon sits in a soft tinted disc so the kind of message reads at a glance (never by colour alone: the shape differs too). */
function Disc({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tone)}>
      {children}
    </span>
  );
}

function Toaster({ className, toastOptions, icons, ...props }: ToasterProps) {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      className={cn("toaster group", className)}
      position="top-right"
      closeButton
      expand={false}
      visibleToasts={3}
      gap={10}
      duration={4000}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      icons={{
        success: (
          <Disc tone="bg-success-bg text-success-text">
            <CheckCircleIcon className="size-5" weight="fill" aria-hidden />
          </Disc>
        ),
        error: (
          <Disc tone="bg-danger-bg text-danger-text">
            <WarningCircleIcon className="size-5" weight="fill" aria-hidden />
          </Disc>
        ),
        warning: (
          <Disc tone="bg-warning-bg text-warning-text">
            <WarningIcon className="size-5" weight="fill" aria-hidden />
          </Disc>
        ),
        info: (
          <Disc tone="bg-info-bg text-info-text">
            <InfoIcon className="size-5" weight="fill" aria-hidden />
          </Disc>
        ),
        close: <XIcon className="size-3.5" weight="bold" aria-hidden />,
        ...icons,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Close notification",
        ...toastOptions,
        classNames: {
          toast:
            "!items-start !gap-3 !rounded-xl !border !border-border !bg-surface !p-3.5 !text-ink !shadow-overlay sm:!w-[380px]",
          icon: "!m-0 !size-8 !shrink-0",
          content: "!gap-0.5",
          title: "!text-sm !font-semibold !leading-5 !text-ink",
          description: "!text-xs !leading-5 !text-muted-text",
          closeButton:
            "!left-auto !right-2 !top-2 !size-6 !translate-x-0 !translate-y-0 !rounded-md !border-0 !bg-transparent !text-muted-text hover:!bg-surface-alt hover:!text-ink",
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
