import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ApprovalRulesPage, RoleEditorPage, RolesPage, StaffPage } from "@/features/access";
import { PlatformConfigPage, ProvidersPage } from "@/features/platform-config";
import {
  AuthProvider,
  AcceptInvitationPage,
  LoginPage,
  RequirePermission,
  SecuritySettingsPage,
} from "@/features/auth";
import {
  BroadcastDetailPage,
  BroadcastsPage,
  NewBroadcastPage,
  TemplatesPage,
  SegmentsPage,
} from "@/features/broadcasts";
import {
  BulkPaymentDetailPage,
  BulkPaymentsPage,
  NewBulkPaymentPage,
} from "@/features/bulk-payments";
import { BannersPage } from "@/features/content";
import { CustomerDetailPage, CustomersPage } from "@/features/customers";
import { OverviewPage } from "@/features/overview";
import { RequestsPage } from "@/features/requests";
import { AuditLogPage, LockPolicyPage, WebhookWhitelistPage } from "@/features/risk";
import { SavingsPage } from "@/features/savings";
import { BankOneRepairPage } from "@/features/system-health";
import { TransactionsPage } from "@/features/transactions";
import { Toaster } from "@/shared/components/ui/Sonner";
import { AppShell } from "./layouts/AppShell";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invite" element={<AcceptInvitationPage />} />
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route
                path="customers"
                element={
                  <RequirePermission permission="customer:view">
                    <CustomersPage />
                  </RequirePermission>
                }
              />
              <Route
                path="customers/:id"
                element={
                  <RequirePermission permission="customer:view">
                    <CustomerDetailPage />
                  </RequirePermission>
                }
              />
              <Route
                path="transactions"
                element={
                  <RequirePermission permission="transaction:view">
                    <TransactionsPage />
                  </RequirePermission>
                }
              />
              <Route path="requests" element={<RequestsPage />} />
              <Route
                path="savings"
                element={
                  <RequirePermission permission="savings:view">
                    <SavingsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="bulk-payments"
                element={
                  <RequirePermission permission="bulk_payment:view">
                    <BulkPaymentsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="bulk-payments/new"
                element={
                  <RequirePermission permission="bulk_payment:initiate">
                    <NewBulkPaymentPage />
                  </RequirePermission>
                }
              />
              <Route
                path="bulk-payments/:id"
                element={
                  <RequirePermission permission="bulk_payment:view">
                    <BulkPaymentDetailPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/broadcasts"
                element={
                  <RequirePermission permission="content:view">
                    <BroadcastsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/broadcast-templates"
                element={
                  <RequirePermission permission="content:view">
                    <TemplatesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/audience-segments"
                element={
                  <RequirePermission permission="content:view">
                    <SegmentsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/broadcasts/new"
                element={
                  <RequirePermission permission="content:edit">
                    <NewBroadcastPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/broadcasts/:id"
                element={
                  <RequirePermission permission="content:view">
                    <BroadcastDetailPage />
                  </RequirePermission>
                }
              />
              <Route
                path="content/banners"
                element={
                  <RequirePermission permission="content:view">
                    <BannersPage />
                  </RequirePermission>
                }
              />
              <Route
                path="risk/lock-policy"
                element={
                  <RequirePermission permission="security_policy:edit">
                    <LockPolicyPage />
                  </RequirePermission>
                }
              />
              <Route
                path="risk/webhook-whitelist"
                element={
                  <RequirePermission permission="integrations:view">
                    <WebhookWhitelistPage />
                  </RequirePermission>
                }
              />
              <Route
                path="risk/audit-log"
                element={
                  <RequirePermission permission="audit_log:view">
                    <AuditLogPage />
                  </RequirePermission>
                }
              />
              <Route
                path="system/bankone"
                element={
                  <RequirePermission permission="customer:repair_bankone">
                    <BankOneRepairPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/staff"
                element={
                  <RequirePermission permission="staff:view">
                    <StaffPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/roles"
                element={
                  <RequirePermission permission="staff:view">
                    <RolesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/roles/:id"
                element={
                  <RequirePermission permission="roles:manage">
                    <RoleEditorPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/approval-rules"
                element={
                  <RequirePermission permission="approval_rules:view">
                    <ApprovalRulesPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/platform-config"
                element={
                  <RequirePermission permission="config:view">
                    <PlatformConfigPage />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/providers"
                element={
                  <RequirePermission permission="provider:view">
                    <ProvidersPage />
                  </RequirePermission>
                }
              />
              <Route path="settings/security" element={<SecuritySettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
