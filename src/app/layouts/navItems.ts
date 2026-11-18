import {
  Bank,
  ChartBar,
  ClipboardText,
  Gauge,
  Image,
  IdentificationBadge,
  ListChecks,
  Lock,
  Megaphone,
  Notepad,
  Plugs,
  UsersThree,
  PiggyBank,
  ShieldCheck,
  Swap,
  SlidersHorizontal,
  UserGear,
  Users,
  WebhooksLogo,
  type Icon,
} from "@phosphor-icons/react";
import type { MessageKey } from "@/shared/i18n/t";

export interface NavLinkItem {
  id: string;
  to: string;
  icon: Icon;
  label: MessageKey;
}

export interface NavGroup {
  id: string;
  label: MessageKey | null;
  items: NavLinkItem[];
}

/** Paths and icons live here; who may see each entry lives in the auth feature (NAV_ACCESS). */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    label: null,
    items: [{ id: "overview", to: "/", icon: Gauge, label: "nav.overview" }],
  },
  {
    id: "customers",
    label: "nav.group.customers",
    items: [
      { id: "customers", to: "/customers", icon: Users, label: "nav.customers" },
      { id: "transactions", to: "/transactions", icon: Swap, label: "nav.transactions" },
      { id: "requests", to: "/requests", icon: ClipboardText, label: "nav.requests" },
      { id: "savings", to: "/savings", icon: PiggyBank, label: "nav.savings" },
    ],
  },
  {
    id: "payments",
    label: "nav.group.payments",
    items: [
      {
        id: "bulk-payments",
        to: "/bulk-payments",
        icon: ListChecks,
        label: "nav.bulkPayments",
      },
    ],
  },
  {
    id: "content",
    label: "nav.group.content",
    items: [
      { id: "banners", to: "/content/banners", icon: Image, label: "nav.banners" },
      { id: "broadcasts", to: "/content/broadcasts", icon: Megaphone, label: "nav.broadcasts" },
      {
        id: "broadcast-templates",
        to: "/content/broadcast-templates",
        icon: Notepad,
        label: "nav.templates",
      },
      {
        id: "audience-segments",
        to: "/content/audience-segments",
        icon: UsersThree,
        label: "nav.segments",
      },
    ],
  },
  {
    id: "risk",
    label: "nav.group.risk",
    items: [
      { id: "lock-policy", to: "/risk/lock-policy", icon: Lock, label: "nav.lockPolicy" },
      { id: "webhooks", to: "/risk/webhook-whitelist", icon: WebhooksLogo, label: "nav.webhooks" },
      { id: "audit", to: "/risk/audit-log", icon: ShieldCheck, label: "nav.audit" },
    ],
  },
  {
    id: "system",
    label: "nav.group.system",
    items: [{ id: "bankone", to: "/system/bankone", icon: Bank, label: "nav.bankone" }],
  },
  {
    id: "settings",
    label: "nav.group.settings",
    items: [
      { id: "staff", to: "/settings/staff", icon: IdentificationBadge, label: "nav.staff" },
      { id: "roles", to: "/settings/roles", icon: UserGear, label: "nav.roles" },
      {
        id: "approval-rules",
        to: "/settings/approval-rules",
        icon: ChartBar,
        label: "nav.approvalRules",
      },
      { id: "providers", to: "/settings/providers", icon: Plugs, label: "nav.providers" },
      {
        id: "platform-config",
        to: "/settings/platform-config",
        icon: SlidersHorizontal,
        label: "nav.platformConfig",
      },
    ],
  },
];
