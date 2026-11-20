/** Names for the areas permissions are grouped under. A module with no entry falls back to its code in words. */
const MODULE_LABELS: Record<string, string> = {
  approval: "Approvals",
  audit: "Audit log",
  banner: "Banners",
  broadcast: "Broadcasts",
  bulk_transfer: "Bulk transfers",
  business: "Businesses",
  config: "Platform controls",
  customer: "Customers",
  dashboard: "Overview",
  fee: "Fees",
  kyb: "Business verification",
  kyc: "Customer verification",
  limits: "Limits",
  notification: "Notifications",
  ops: "Operations",
  platform_wallet: "Company wallets",
  provider: "Providers",
  recon: "Reconciliation",
  report: "Reports",
  risk: "Risk",
  role: "Roles",
  savings: "Savings",
  settings: "Account settings",
  settlement: "Settlements",
  staff: "Staff",
  txn: "Transactions",
  wallet: "Wallets",
  webhook_ip: "Webhook IP addresses",
};

export function moduleLabel(module: string): string {
  return (
    MODULE_LABELS[module] ??
    module.replace(/[_-]/g, " ").replace(/^\w/, (first) => first.toUpperCase())
  );
}
