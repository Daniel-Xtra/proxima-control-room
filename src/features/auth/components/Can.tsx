import type { ReactNode } from "react";
import { useCan } from "../hooks/useSession";
import type { Permission } from "../model/permissions";
import { PermissionDenied } from "./PermissionDenied";

/** Hides its children without the permission. The backend still enforces it. */
export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  const can = useCan();
  return can(permission) ? <>{children}</> : null;
}

/** Route guard: shows the permission-denied state instead of the page. A list means any one of them is enough. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission | readonly Permission[];
  children: ReactNode;
}) {
  const can = useCan();
  return [permission].flat().some(can) ? <>{children}</> : <PermissionDenied />;
}
