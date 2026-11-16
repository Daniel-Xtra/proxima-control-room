import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";
import { BrandMark } from "@/shared/components/BrandMark";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_ACCESS, canAccess, useSession } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { NAV_GROUPS } from "./navItems";

const KEY = "proxima.sidebar";

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) === "collapsed";
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(KEY, next ? "collapsed" : "open");
      } catch {
        // The preference only lasts for this visit.
      }
      return next;
    });
  return [collapsed, toggle] as const;
}

function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { user } = useSession();
  const held = new Set(user?.permissions ?? []);
  const allowed = new Set(
    NAV_ACCESS.filter((entry) => canAccess(entry, held)).map((entry) => entry.id),
  );
  const pending = usePendingRequestCount(held.has("request:view_all")).data ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className={cn("py-4", collapsed ? "flex justify-center px-2" : "px-4")}>
        <div className="flex items-center gap-2.5">
          <BrandMark />
          {collapsed ? null : (
            <p className="m-0 text-base font-semibold leading-tight tracking-tight text-ink">
              {t("app.name")}
            </p>
          )}
        </div>
      </div>
      <nav aria-label={t("shell.navigation")} className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV_GROUPS.map((group, groupIndex) => {
          const items = group.items.filter((item) => allowed.has(item.id));
          if (items.length === 0) return null;
          return (
            <div
              key={group.id}
              className={cn(
                groupIndex > 0 && (collapsed ? "mt-2 border-t border-border-soft pt-2" : "mt-4"),
              )}
            >
              {group.label && !collapsed ? (
                <p className="m-0 px-3 pb-1 text-sm font-medium uppercase text-muted-text">
                  {t(group.label)}
                </p>
              ) : null}
              <ul className="m-0 list-none space-y-0.5 p-0">
                {items.map((item) => {
                  const showBadge = item.id === "requests" && pending > 0;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        onClick={onNavigate}
                        title={collapsed ? t(item.label) : undefined}
                        aria-label={collapsed ? t(item.label) : undefined}
                        className={({ isActive }) =>
                          cn(
                            "relative flex items-center rounded-sm text-sm font-medium text-body hover:bg-surface-muted",
                            collapsed
                              ? "mx-auto size-[51px] justify-center"
                              : "h-[51px] gap-3 px-3",
                            isActive && "bg-nav-active text-ink",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              size={20}
                              weight={isActive ? "duotone" : "regular"}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            {collapsed ? null : (
                              <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                            )}
                            {showBadge ? (
                              <span
                                className={cn(
                                  "flex shrink-0 items-center justify-center rounded-pill bg-danger font-semibold text-on-ink",
                                  collapsed
                                    ? "absolute right-1 top-1 size-2.5 border-2 border-surface"
                                    : "h-5 min-w-5 px-1 text-[10px]",
                                )}
                                aria-label={t("shell.pendingCount", { count: pending })}
                              >
                                {collapsed ? null : pending > 9 ? "9+" : pending}
                              </span>
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/** Sticky sidebar on desktop, slide-in drawer below the md breakpoint. */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [collapsed, toggle] = useCollapsed();
  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 self-start border-r border-border bg-surface transition-[width] duration-200 md:block",
          collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
          className="absolute -right-3 top-[22px] z-30 flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-text shadow-sm hover:bg-surface-muted hover:text-ink"
        >
          {collapsed ? (
            <CaretDoubleRight size={12} weight="bold" aria-hidden="true" />
          ) : (
            <CaretDoubleLeft size={12} weight="bold" aria-hidden="true" />
          )}
        </button>
      </aside>

      {open ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-40 bg-overlay"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface shadow-lg">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
