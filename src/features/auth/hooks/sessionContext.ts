import { createContext } from "react";
import type { SessionUser } from "../model/session";

export interface SessionValue {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
}

export const SessionContext = createContext<SessionValue | null>(null);
