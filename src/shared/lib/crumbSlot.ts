import { createContext } from "react";

/** Where the app shell shows the breadcrumb. `PageHeader` renders into it, and falls back to the page when there is none. */
export const CrumbSlotContext = createContext<HTMLElement | null>(null);
