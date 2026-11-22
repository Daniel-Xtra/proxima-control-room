import { CaretDown, GearSix, ShieldCheck, List, SignOut, Buildings } from "@phosphor-icons/react";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CopyrightFooter } from "@/shared/components/CopyrightFooter";
import { IdleGuard, LoginPage, useSession } from "@/features/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { ThemeSwitch } from "@/shared/components/ThemeSwitch";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";
import { CrumbSlotContext } from "@/shared/lib/crumbSlot";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [crumbSlot, setCrumbSlot] = useState<HTMLElement | null>(null);

  // Signed out: the sign-in screen is shown at whatever address was asked for, and the page opens after sign-in.
  if (!user) return <LoginPage />;

  return (
    <>
      <a
        href="#main"
        className="absolute -top-10 left-2 z-50 rounded-md bg-ink px-3 py-2 text-on-ink focus:top-2"
      >
        {t("shell.skip")}
      </a>
      <div className="flex min-h-full">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink hover:bg-surface-muted lg:hidden"
                aria-label={t("shell.openMenu")}
                onClick={() => setNavOpen(true)}
              >
                <List size={18} aria-hidden="true" />
              </button>
              {/* Each page puts its breadcrumb here. */}
              <div ref={setCrumbSlot} className="flex min-w-0 flex-col gap-0.5" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-pill border border-blue-border bg-blue-tint px-3 py-1 text-xs font-medium text-ink xl:inline-flex">
                <Buildings size={12} aria-hidden="true" />
                {t("shell.environment")}
              </span>
              <span aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("shell.accountMenu")}
                    className="flex cursor-pointer items-center gap-3 rounded-lg py-1 pr-2 pl-1 hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-ink"
                    >
                      {initials(user.name)}
                    </span>
                    <span className="hidden min-w-0 text-left md:block">
                      <span className="block max-w-40 truncate text-sm leading-tight font-medium text-ink">
                        {user.name}
                      </span>
                      <span className="block max-w-40 truncate text-xs leading-tight text-muted-text">
                        {user.roleNames.join(", ")}
                      </span>
                    </span>
                    <CaretDown
                      size={14}
                      aria-hidden="true"
                      className="hidden text-muted-text md:block"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-72 rounded-xl p-0 shadow-lg"
                >
                  <div className="flex items-center gap-3 p-4">
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted font-heading text-base font-semibold text-ink"
                    >
                      {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="m-0 truncate text-xs text-muted-text">{user.email}</p>
                      <p className="m-0 mt-1 flex items-center gap-1 truncate text-xs font-medium text-muted-text">
                        <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
                        {user.roleNames.join(", ")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-2">
                    <DropdownMenuItem
                      className="h-10 gap-3 px-2 text-sm"
                      onSelect={() => navigate("/settings/security")}
                    >
                      <GearSix aria-hidden="true" className="size-4 text-muted-text" />
                      {t("shell.accountSettings")}
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-3">
                    <p className="m-0 mb-2 text-xs font-medium text-muted-text">
                      {t("security.appearance")}
                    </p>
                    <ThemeSwitch />
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-2">
                    <DropdownMenuItem
                      className="h-10 gap-3 px-2 text-sm text-danger-text focus:bg-danger-soft focus:text-danger-text"
                      onSelect={() => {
                        signOut();
                        navigate("/", { replace: true });
                      }}
                    >
                      <SignOut aria-hidden="true" className="size-4" />
                      {t("shell.signOut")}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 md:px-6">
            <CrumbSlotContext.Provider value={crumbSlot}>
              <Outlet />
            </CrumbSlotContext.Provider>
          </main>
          <footer className="px-4 pb-4 md:px-6">
            <CopyrightFooter />
          </footer>
        </div>
      </div>
      <IdleGuard />
    </>
  );
}
