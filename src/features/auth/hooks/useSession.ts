import { useContext } from "react";
import type { Permission } from "../model/permissions";
import { SessionContext, type SessionValue } from "./sessionContext";

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside AuthProvider");
  return value;
}

export function useCurrentUser() {
  const { user } = useSession();
  if (!user) throw new Error("No signed-in user");
  return user;
}

/** Deny by default: unknown or missing permissions are refused. */
export function useCan() {
  const { user } = useSession();
  return (permission: Permission) => user?.permissions.includes(permission) ?? false;
}
