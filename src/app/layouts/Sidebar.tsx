import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";
import { BrandMark } from "@/shared/components/BrandMark";
import { BrandWordmark } from "@/shared/components/BrandWordmark";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_ACCESS, canAccess, useSession } from "@/features/auth";
import { usePendingRequestCount } from "@/features/requests";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { NAV_GROUPS } from "./navItems";

const KEY = "proxima.sidebar";

/** Labels fade with the width, so they never pop in or out while the sidebar moves. */
const FADE = "transition-opacity duration-200 motion-reduce:transition-none";

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
      <div className="py-4 pl-[26px]">
        {/* The icon and the full logo sit in the same place and cross-fade, while the box around them changes width. */}
        <div
          className={cn(
            "relative h-9 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            collapsed ? "w-6" : "w-[103px]",
          )}
        >
          <BrandMark className={cn("absolute top-0 left-0 h-9", FADE, !collapsed && "opacity-0")} />
          <BrandWordmark className={cn("absolute top-0 left-0", FADE, collapsed && "opacity-0")} />
        </div>
      </div>
      <nav
        aria-label={t("shell.navigation")}
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto pb-4",
          // Collapsed, the gutter is kept on both sides so the bar shows without pushing the icons off-centre.
          collapsed ? "px-0.5 [scrollbar-gutter:stable_both-edges]" : "px-3",
        )}
      >
        {NAV_GROUPS.map((group, groupIndex) => {
          const items = group.items.filter((item) => allowed.has(item.id));
          if (items.length === 0) return null;
          return (
            <div
              key={group.id}
              className={cn(
                groupIndex > 0 && "border-t pt-2 mt-2",
                groupIndex > 0 && (collapsed ? "border-border-soft" : "border-transparent"),
                "transition-[border-color] duration-300",
              )}
            >
              {group.label ? (
                <p
                  aria-hidden={collapsed}
                  className={cn(
                    "m-0 overflow-hidden px-3 text-sm font-medium whitespace-nowrap uppercase text-muted-text",
                    "transition-[max-height,opacity,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    collapsed ? "max-h-0 pb-0 opacity-0" : "max-h-8 pb-1 opacity-100",
                  )}
                >
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
                            "relative flex h-10 items-center gap-3 overflow-hidden rounded-sm pl-[15.5px] text-sm font-medium whitespace-nowrap text-body hover:bg-surface-muted",
                            isActive && "bg-nav-active text-ink",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              size={20}
                              weight={isActive ? "duotone" : "regular"}
                              className={cn("shrink-0", isActive && "text-nav-icon-active")}
                              aria-hidden="true"
                            />
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate",
                                FADE,
                                collapsed && "opacity-0",
                              )}
                            >
                              {t(item.label)}
                            </span>
                            {showBadge ? (
                              <span
                                className={cn(
                                  "flex shrink-0 items-center justify-center rounded-pill bg-danger font-semibold text-on-ink",
                                  "transition-all duration-300",
                                  collapsed
                                    ? "absolute right-1.5 top-1.5 size-2.5 border-2 border-surface"
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
          "sticky top-0 z-40 hidden h-screen shrink-0 self-start border-r border-border bg-surface transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:block",
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
        <div className="lg:hidden">
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
