import { CaretDown, List, Moon, ShieldCheck, SignOut, Sun, Buildings } from "@phosphor-icons/react";
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
import { useTheme } from "@/shared/lib/theme";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

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
          <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink hover:bg-surface-muted md:hidden"
                aria-label={t("shell.openMenu")}
                onClick={() => setNavOpen(true)}
              >
                <List size={18} aria-hidden="true" />
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-blue-border bg-blue-tint px-3 py-1 text-xs font-medium text-ink">
                <Buildings size={12} aria-hidden="true" />
                {t("shell.environment")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={theme === "dark"}
                aria-label={t("shell.darkMode")}
                title={t("shell.darkMode")}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-border-control text-body hover:bg-surface-muted"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Moon size={18} aria-hidden="true" />
                ) : (
                  <Sun size={18} aria-hidden="true" />
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("shell.accountMenu")}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent py-1 pl-1 pr-2 hover:border-border hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 items-center justify-center rounded-md bg-ink text-sm font-semibold text-on-ink"
                    >
                      {initials(user.name)}
                    </span>
                    <span className="hidden min-w-0 text-left md:block">
                      <span className="block max-w-40 truncate text-sm leading-tight text-ink">
                        {user.name}
                      </span>
                      <span className="block max-w-40 truncate text-xs leading-tight text-muted-text">
                        {user.roleNames.join(", ")}
                      </span>
                    </span>
                    <CaretDown size={14} aria-hidden="true" className="text-muted-text" />
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
            <Outlet />
          </main>
        </div>
      </div>
      <IdleGuard />
    </>
  );
}
