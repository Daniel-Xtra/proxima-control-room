import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { DateText } from "@/shared/components/DateText";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { DataTable } from "@/shared/components/DataTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { messages } from "@/shared/i18n/messages";
import { t, type MessageKey } from "@/shared/i18n/t";
import { listApprovalRules, setApprovalExpiry, type ApprovalRule } from "../api/approvalRulesApi";

const RULES_KEY = ["access", "approval-rules"];

/** A readable name for an approval type, or the raw code when it has no label yet. */
function typeLabel(type: string) {
  const key = `approvalRules.type.${type}`;
  return key in messages ? t(key as MessageKey) : type;
}

export function ApprovalRulesPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const editable = can("approval_rules:manage");
  const [filters, setFilter] = useUrlFilters({ q: "", page: "1", limit: "10" });
  const query = useApiQuery(
    [...RULES_KEY, filters.page, filters.limit, filters.q],
    () => listApprovalRules(Number(filters.page), Number(filters.limit), filters.q),
    { staleTime: 0, placeholderData: (previous) => previous },
  );
  const [editing, setEditing] = useState<ApprovalRule | null>(null);
  const [hours, setHours] = useState("");

  const bounds = query.data;
  const parsed = Number(hours);
  const valid =
    bounds !== undefined &&
    Number.isInteger(parsed) &&
    parsed >= bounds.minExpiryHours &&
    parsed <= bounds.maxExpiryHours;

  return (
    <>
      <PageHeader
        title={t("approvalRules.title")}
        crumbs={[{ label: t("nav.group.settings") }, { label: t("approvalRules.title") }]}
        description={t("approvalRules.description")}
      />
      <FilterBar
        onClear={() => setFilter("q", "")}
        dirty={filters.q !== ""}
        search={{
          value: filters.q,
          onChange: (v) => setFilter("q", v),
          placeholder: t("approvalRules.search"),
          label: t("approvalRules.searchLabel"),
        }}
      />
      <SectionCard flush>
        <AsyncBody query={query} isEmpty={(data) => data.total === 0}>
          {(data) => (
            <DataTable<ApprovalRule>
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setFilter("page", String(page))}
              onLimitChange={(limit) => setFilter("limit", String(limit))}
              storageKey="approval-rules"
              caption={t("approvalRules.title")}
              rows={data.rules}
              getRowId={(r) => r.type}
              columns={[
                {
                  key: "action",
                  header: t("approvalRules.col.action"),
                  sortValue: (r: { type: string }) => r.type,
                  cell: (r) => typeLabel(r.type),
                },
                {
                  key: "second",
                  header: t("approvalRules.col.second"),
                  cell: () => <BooleanBadge value />,
                },
                {
                  key: "request",
                  header: t("approvalRules.col.request"),
                  cell: (r) => <PermissionList codes={r.requestPermissions} />,
                },
                {
                  key: "approve",
                  header: t("approvalRules.col.permission"),
                  cell: (r) => <PermissionList codes={r.approvePermissions} />,
                },
                {
                  key: "expiry",
                  header: t("approvalRules.col.expiry"),
                  sortValue: (r: { expiryHours: number }) => r.expiryHours,
                  cell: (r) => (
                    <span>
                      {t("approvalRules.hours", { hours: r.expiryHours })}
                      {r.overridden ? null : (
                        <span className="text-muted-text"> · {t("approvalRules.default")}</span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "changed",
                  header: t("approvalRules.col.changed"),
                  cell: (r) =>
                    r.updatedAt ? (
                      <span>
                        {r.updatedByName ?? t("common.notAvailable")} ·{" "}
                        <DateText iso={r.updatedAt} dateOnly />
                      </span>
                    ) : (
                      t("common.notAvailable")
                    ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (r) =>
                    editable ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setHours(String(r.expiryHours));
                          setEditing(r);
                        }}
                      >
                        {t("approvalRules.change")}
                      </Button>
                    ) : null,
                },
              ]}
            />
          )}
        </AsyncBody>
      </SectionCard>
      <p className="mt-3 text-xs text-muted-text">{t("approvalRules.note")}</p>

      <ActionDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("approvalRules.save.title")}
        description={editing ? typeLabel(editing.type) : undefined}
        impact={t("approvalRules.save.impact")}
        confirmLabel={t("common.save")}
        blocked={!valid}
        onConfirm={async ({ reason }) => {
          if (editing) await setApprovalExpiry(editing.type, parsed, reason);
          await queryClient.invalidateQueries({ queryKey: RULES_KEY });
          return t("approvalRules.saved");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-expiry">{t("approvalRules.expiryLabel")}</Label>
          <Input
            id="rule-expiry"
            type="number"
            inputMode="numeric"
            min={bounds?.minExpiryHours}
            max={bounds?.maxExpiryHours}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
          {bounds ? (
            <p className="text-xs text-muted-text">
              {t("approvalRules.expiryHelp", {
                min: bounds.minExpiryHours,
                max: bounds.maxExpiryHours,
              })}
            </p>
          ) : null}
        </div>
      </ActionDialog>
    </>
  );
}

function PermissionList({ codes }: { codes: string[] }) {
  return <span className="text-xs text-muted-text">{codes.join(", ")}</span>;
}
