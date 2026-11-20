import {
  CaretDown,
  CaretRight,
  GearSix,
  ShieldCheck,
  List,
  SignOut,
  Buildings,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IdleGuard, useSession } from "@/features/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [crumbSlot, setCrumbSlot] = useState<HTMLElement | null>(null);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

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
                      className="flex size-10 items-center justify-center rounded-lg bg-info-bg text-sm font-semibold text-info-text"
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
                  sideOffset={12}
                  className="relative w-80 overflow-visible rounded-xl p-0 shadow-lg"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 right-6 size-3 rotate-45 rounded-xs bg-info-bg"
                  />
                  <div
                    aria-hidden="true"
                    className="h-16 rounded-t-xl bg-linear-to-br from-info-bg via-blue-tint-strong to-blue-tint"
                  />
                  <div className="px-4 pb-4">
                    <span
                      aria-hidden="true"
                      className="-mt-8 flex size-16 items-center justify-center rounded-2xl bg-primary font-heading text-2xl font-semibold text-on-ink ring-4 ring-popover"
                    >
                      {initials(user.name)}
                    </span>
                    <p className="m-0 mt-3 truncate font-heading text-base font-semibold text-ink">
                      {user.name}
                    </p>
                    <p className="m-0 truncate text-xs text-muted-text">{user.email}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-pill border border-blue-border bg-blue-tint px-2.5 py-0.5 text-xs font-medium text-ink">
                      <ShieldCheck aria-hidden="true" className="size-3.5" />
                      {user.roleNames.join(", ")}
                    </span>

                    <ThemeSwitch className="mt-4" />

                    <DropdownMenuItem
                      className="mt-3 h-10 justify-between px-2 text-sm"
                      onSelect={() => navigate("/settings/security")}
                    >
                      <span className="flex items-center gap-3">
                        <GearSix aria-hidden="true" className="size-4" />
                        {t("shell.accountSettings")}
                      </span>
                      <CaretRight aria-hidden="true" className="size-3.5 text-muted-text" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="mt-2 h-10 justify-center gap-2 rounded-lg border border-danger-border bg-danger-soft text-sm font-medium text-danger-text focus:bg-danger-bg focus:text-danger-text"
                      onSelect={() => {
                        signOut();
                        navigate("/login");
                      }}
                    >
                      {t("shell.signOut")}
                      <SignOut aria-hidden="true" />
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
        </div>
      </div>
      <IdleGuard />
    </>
  );
}
