import { access } from "./messages/access";
import { auth } from "./messages/auth";
import { broadcasts } from "./messages/broadcasts";
import { bulk } from "./messages/bulk";
import { common } from "./messages/common";
import { config } from "./messages/config";
import { customers } from "./messages/customers";
import { operations } from "./messages/operations";
import { segments } from "./messages/segments";
import { requests } from "./messages/requests";
import { savings } from "./messages/savings";
import { templates } from "./messages/templates";
import { transactions } from "./messages/transactions";

/** Every user-facing string. Sections live in ./messages/ and are merged here. */
export const messages = {
  ...common,
  ...access,
  ...auth,
  ...customers,
  ...transactions,
  ...requests,
  ...savings,
  ...bulk,
  ...broadcasts,
  ...templates,
  ...segments,
  ...config,
  ...operations,
} as const;

export type MessageKey = keyof typeof messages;
