import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Switch } from "@/shared/components/ui/Switch";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import {
  DEFAULT_POLICY,
  clearPolicyCache,
  getLockPolicy,
  saveLockPolicy,
  type LockPolicy,
} from "../api/riskApi";

type Draft = Omit<LockPolicy, "updatedBy" | "updatedAt">;
type Dialog = "save" | "reset" | "cache" | null;

export function LockPolicyPage() {
  const query = useApiQuery(["risk", "lock-policy"], getLockPolicy);
  return (
    <>
      <PageHeader
        title={t("lockPolicy.title")}
        crumbs={[{ label: t("nav.group.risk") }, { label: t("lockPolicy.title") }]}
        description={t("lockPolicy.description")}
      />
      <AsyncBody query={query}>
        {(policy) => <PolicyForm key={policy.updatedAt} policy={policy} />}
      </AsyncBody>
    </>
  );
}

function PolicyForm({ policy }: { policy: LockPolicy }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const editable = can("security_policy:edit");
  const [draft, setDraft] = useState<Draft>(policy);
  const [dialog, setDialog] = useState<Dialog>(null);

  const valid =
    draft.maxFailedAttempts >= 1 && draft.lockMinutes >= 1 && draft.resetWindowMinutes >= 1;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["risk", "lock-policy"] });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const numberField = (
    key: "maxFailedAttempts" | "lockMinutes" | "resetWindowMinutes",
    label: string,
    id: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={1}
        disabled={!editable}
        value={draft[key]}
        onChange={(e) => set(key, Number(e.target.value))}
      />
    </div>
  );

  return (
    <>
      <SectionCard
        title={t("lockPolicy.section")}
        description={t("lockPolicy.updated", { name: policy.updatedBy })}
        actions={
          <span className="text-xs text-muted-text">
            <DateText iso={policy.updatedAt} />
          </span>
        }
      >
        <div className="grid max-w-xl gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="policy-enabled"
              disabled={!editable}
              checked={draft.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
            <Label htmlFor="policy-enabled">{t("lockPolicy.enabled")}</Label>
          </div>
          {numberField("maxFailedAttempts", t("lockPolicy.maxAttempts"), "policy-max")}
          {numberField("lockMinutes", t("lockPolicy.lockMinutes"), "policy-lock")}
          {numberField("resetWindowMinutes", t("lockPolicy.resetWindow"), "policy-window")}
        </div>
        {editable ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={!valid} onClick={() => setDialog("save")}>
              {t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("reset")}>
              {t("lockPolicy.reset")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("cache")}>
              {t("lockPolicy.clearCache")}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-text">{t("lockPolicy.readOnly")}</p>
        )}
      </SectionCard>

      <ActionDialog
        open={dialog === "save"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("lockPolicy.save.title")}
        impact={t("lockPolicy.save.impact", {
          attempts: draft.maxFailedAttempts,
          minutes: draft.lockMinutes,
        })}
        confirmLabel={t("common.save")}
        onConfirm={async ({ reason }) => {
          await saveLockPolicy(draft, user.name, reason);
          await refresh();
          return t("lockPolicy.saved");
        }}
      />
      <ActionDialog
        open={dialog === "reset"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("lockPolicy.reset")}
        impact={t("lockPolicy.reset.impact")}
        confirmLabel={t("lockPolicy.reset")}
        destructive
        onConfirm={async ({ reason }) => {
          await saveLockPolicy(DEFAULT_POLICY, user.name, reason);
          await refresh();
          return t("lockPolicy.saved");
        }}
      />
      <ActionDialog
        open={dialog === "cache"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("lockPolicy.clearCache")}
        impact={t("lockPolicy.cache.impact")}
        confirmLabel={t("lockPolicy.clearCache")}
        onConfirm={async ({ reason }) => {
          await clearPolicyCache(reason);
          return t("lockPolicy.cacheCleared");
        }}
      />
    </>
  );
}
