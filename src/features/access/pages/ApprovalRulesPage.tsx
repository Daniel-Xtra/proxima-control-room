import { useState } from "react";
import { permissionLabelKey, useCan, type Permission } from "@/features/auth";
import { recordAudit } from "@/shared/api/auditStore";
import { simulate } from "@/shared/api/client";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Switch } from "@/shared/components/ui/Switch";
import { t, type MessageKey } from "@/shared/i18n/t";

interface Rule {
  id: string;
  label: MessageKey;
  needsApproval: boolean;
  approvers: number;
  approverPermission: Permission;
  thresholdNaira: string;
}

const INITIAL: Rule[] = [
  {
    id: "freeze",
    label: "approvalRules.freeze",
    needsApproval: true,
    approvers: 1,
    approverPermission: "freeze_request:approve",
    thresholdNaira: "0",
  },
  {
    id: "unfreeze",
    label: "approvalRules.unfreeze",
    needsApproval: true,
    approvers: 1,
    approverPermission: "unfreeze_request:approve",
    thresholdNaira: "0",
  },
  {
    id: "limit",
    label: "approvalRules.limit",
    needsApproval: true,
    approvers: 1,
    approverPermission: "limit_request:approve",
    thresholdNaira: "0",
  },
  {
    id: "limit-high",
    label: "approvalRules.limitHigh",
    needsApproval: true,
    approvers: 2,
    approverPermission: "limit_request:approve",
    thresholdNaira: "1000000",
  },
  {
    id: "role",
    label: "approvalRules.role",
    needsApproval: true,
    approvers: 1,
    approverPermission: "roles:manage",
    thresholdNaira: "0",
  },
  {
    id: "2fa",
    label: "approvalRules.twoFactor",
    needsApproval: true,
    approvers: 1,
    approverPermission: "2fa:reset",
    thresholdNaira: "0",
  },
  {
    id: "liquidate",
    label: "approvalRules.liquidate",
    needsApproval: false,
    approvers: 1,
    approverPermission: "savings:liquidate",
    thresholdNaira: "0",
  },
  {
    id: "config",
    label: "approvalRules.config",
    needsApproval: true,
    approvers: 1,
    approverPermission: "config:approve",
    thresholdNaira: "0",
  },
];

export function ApprovalRulesPage() {
  const can = useCan();
  const editable = can("config:edit");
  const [rules, setRules] = useState(INITIAL);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const update = (id: string, patch: Partial<Rule>) =>
    setRules((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <>
      <PageHeader
        title={t("approvalRules.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("approvalRules.title") }]}
        description={t("approvalRules.description")}
        actions={
          editable ? <Button onClick={() => setConfirmOpen(true)}>{t("common.save")}</Button> : null
        }
      />
      <SectionCard flush>
        <SimpleTable<Rule>
          caption={t("approvalRules.title")}
          rows={rules}
          getRowId={(r) => r.id}
          columns={[
            { key: "action", header: t("approvalRules.col.action"), cell: (r) => t(r.label) },
            {
              key: "needs",
              header: t("approvalRules.col.needs"),
              cell: (r) => (
                <Switch
                  checked={r.needsApproval}
                  disabled={!editable}
                  aria-label={t("approvalRules.needsNamed", { action: t(r.label) })}
                  onCheckedChange={(v) => update(r.id, { needsApproval: v })}
                />
              ),
            },
            {
              key: "approvers",
              header: t("approvalRules.col.approvers"),
              cell: (r) => (
                <Input
                  type="number"
                  min={1}
                  max={3}
                  className="w-16"
                  disabled={!editable || !r.needsApproval}
                  aria-label={t("approvalRules.approversNamed", { action: t(r.label) })}
                  value={r.approvers}
                  onChange={(e) => update(r.id, { approvers: Number(e.target.value) })}
                />
              ),
            },
            {
              key: "perm",
              header: t("approvalRules.col.permission"),
              cell: (r) => t(permissionLabelKey(r.approverPermission)),
            },
            {
              key: "threshold",
              header: t("approvalRules.col.threshold"),
              cell: (r) => (
                <Input
                  inputMode="decimal"
                  className="w-32"
                  disabled={!editable || !r.needsApproval}
                  aria-label={t("approvalRules.thresholdNamed", { action: t(r.label) })}
                  value={r.thresholdNaira}
                  onChange={(e) => update(r.id, { thresholdNaira: e.target.value })}
                />
              ),
            },
          ]}
        />
      </SectionCard>
      <p className="mt-3 text-xs text-muted-text">{t("approvalRules.note")}</p>

      <ActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("approvalRules.save.title")}
        impact={t("approvalRules.save.impact")}
        confirmLabel={t("common.save")}
        onConfirm={async ({ reason }) => {
          await simulate(() => undefined);
          recordAudit({
            action: "config.approval_rules.update",
            target: "Maker-checker rules",
            reason,
          });
          return t("approvalRules.saved");
        }}
      />
    </>
  );
}
