import type { ReactNode } from "react";
import { Link } from "react-router-dom";

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
}

export function PageHeader({ title, description, actions, crumbs, logo, meta }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {crumbs?.length ? (
          <nav aria-label={title} className="mb-1">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-xs">
              {crumbs.map((crumb, index) => (
                <li key={`${index}-${crumb.label}`} className="flex items-center gap-1">
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="inline-block py-1.5 text-blue-strong hover:underline sm:py-0"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-muted-text">{crumb.label}</span>
                  )}
                  {index < crumbs.length - 1 ? (
                    <span aria-hidden="true" className="text-muted-text">
                      ›
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="flex items-center gap-4">
          {logo}
          <div className="min-w-0">
            <h1 className="text-2xl">{title}</h1>
            {description ? <p className="m-0 mt-1 text-sm text-body">{description}</p> : null}
            {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
