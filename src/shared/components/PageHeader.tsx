import { CaretRight, House } from "@phosphor-icons/react";
import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { CrumbSlotContext } from "../lib/crumbSlot";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Group › page, with links for everything but the current page. */
  crumbs?: Crumb[];
  /** Avatar or logo tile shown beside the title. */
  logo?: ReactNode;
  /** Badges shown under the title. */
  meta?: ReactNode;
  /** Keeps the breadcrumb but shows no page name in the page, for screens whose own heading says it. */
  hideTitle?: boolean;
}

/** Group › page, with the current page last. Earlier steps are hidden on phones, where the title says where you are. */
function Breadcrumbs({ crumbs, label }: { crumbs: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="hidden min-w-0 sm:block">
      <ol className="m-0 flex min-w-0 list-none items-center gap-1 p-0 text-sm">
        <li className="flex items-center gap-1 text-muted-text">
          <House aria-hidden="true" className="size-4 shrink-0" />
          <CaretRight aria-hidden="true" className="size-3.5 shrink-0" />
        </li>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${index}-${crumb.label}`} className="flex min-w-0 items-center gap-1">
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  className="truncate text-muted-text hover:text-ink hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={`truncate ${last ? "font-medium text-ink" : "text-muted-text"}`}
                >
                  {crumb.label}
                </span>
              )}
              {last ? null : (
                <CaretRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-text" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** In the app shell the breadcrumb sits in the top bar; the page name, description, badges and actions stay in the page. */
export function PageHeader({
  title,
  description,
  actions,
  crumbs,
  logo,
  meta,
  hideTitle,
}: PageHeaderProps) {
  const slot = useContext(CrumbSlotContext);
  const trail = crumbs?.length ? <Breadcrumbs crumbs={crumbs} label={title} /> : null;

  if (hideTitle) {
    return (
      <>
        {slot ? createPortal(trail, slot) : null}
        <h1 className="sr-only">{title}</h1>
      </>
    );
  }

  return (
    <>
      {slot ? createPortal(trail, slot) : null}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {slot ? null : trail ? <div className="mb-1">{trail}</div> : null}
          <div className="flex items-center gap-4">
            {logo}
            <div className="min-w-0">
              <h1 className="text-2xl">{title}</h1>
              {description ? <p className="m-0 mt-1 text-sm text-body">{description}</p> : null}
              {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
            </div>
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 max-sm:w-full">{actions}</div>
        ) : null}
      </header>
    </>
  );
}
