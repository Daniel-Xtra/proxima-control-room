import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No padding around the content, for tables that run edge to edge. */
  flush?: boolean;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  flush,
}: SectionCardProps) {
  return (
    <Card className={cn("gap-0 border-border bg-card py-0 shadow-[var(--shadow-card)]", className)}>
      {title ? (
        <CardHeader className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
          <div className="min-w-0">
            <CardTitle>
              <h2 className="m-0 text-sm font-medium">{title}</h2>
            </CardTitle>
            {description ? <p className="m-0 text-xs text-muted-text">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={flush ? "p-0" : "p-4"}>{children}</CardContent>
    </Card>
  );
}
