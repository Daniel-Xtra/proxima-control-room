import {
  CaretDown,
  List,
  Monitor,
  Moon,
  ShieldCheck,
  SignOut,
  Sun,
  Buildings,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IdleGuard, useSession } from "@/features/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";
import { CrumbSlotContext } from "@/shared/lib/crumbSlot";
import { useTheme } from "@/shared/lib/theme";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [crumbSlot, setCrumbSlot] = useState<HTMLElement | null>(null);
  const { theme, next: nextTheme } = useTheme();
  const ThemeGlyph = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

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
              {/* Each page puts its breadcrumb and name here. */}
              <div ref={setCrumbSlot} className="flex min-w-0 flex-col gap-0.5" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-pill border border-blue-border bg-blue-tint px-3 py-1 text-xs font-medium text-ink xl:inline-flex">
                <Buildings size={12} aria-hidden="true" />
                {t("shell.environment")}
              </span>
              <button
                type="button"
                aria-label={`${t("shell.theme")}: ${t(`shell.theme.${theme}`)}`}
                title={`${t("shell.theme")}: ${t(`shell.theme.${theme}`)}`}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-surface-muted"
                onClick={nextTheme}
              >
                <ThemeGlyph size={18} aria-hidden="true" />
              </button>
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
                <DropdownMenuContent className="w-60">
                  <DropdownMenuLabel>
                    <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-text">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/settings/security")}>
                    <ShieldCheck aria-hidden="true" />
                    {t("shell.security")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-danger-text"
                    onSelect={() => {
                      signOut();
                      navigate("/login");
                    }}
                  >
                    <SignOut aria-hidden="true" />
                    {t("shell.signOut")}
                  </DropdownMenuItem>
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
