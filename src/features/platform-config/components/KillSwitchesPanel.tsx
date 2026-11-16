import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Switch } from "@/shared/components/ui/Switch";
import { t } from "@/shared/i18n/t";
import { setKillSwitch } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { KillSwitch } from "../model/types";

interface Props {
  switches: KillSwitch[];
  /** Holds `config:kill_switch`. */
  editable: boolean;
}

export function KillSwitchesPanel({ switches, editable }: Props) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<{ item: KillSwitch; enable: boolean } | null>(null);
  const stopped = switches.filter((item) => !item.enabled).length;
  const name = target ? t(`config.switch.${target.item.id}`) : "";

  return (
    <SectionCard
      title={t("config.section.switches")}
      description={t("config.switches.description")}
      actions={
        stopped > 0 ? (
          <StatusBadge tone="danger" label={t("config.switches.stopped", { count: stopped })} />
        ) : (
          <StatusBadge tone="success" label={t("config.switches.allRunning")} />
        )
      }
    >
      <ul className="m-0 list-none divide-y divide-border-soft p-0">
        {switches.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 max-w-xl">
              <p className="m-0 flex items-center gap-2 text-sm font-medium text-ink">
                {t(`config.switch.${item.id}`)}
                <StatusBadge
                  tone={item.enabled ? "success" : "danger"}
                  label={item.enabled ? t("config.state.running") : t("config.state.stopped")}
                />
              </p>
              <p className="m-0 text-xs text-muted-text">{t(`config.switch.${item.id}.desc`)}</p>
              <p className="m-0 text-xs text-muted-text">
                {t("config.switches.changed", { name: item.changedBy })} ·{" "}
                <DateText iso={item.changedAt} /> · {item.reason}
              </p>
            </div>
            <Switch
              checked={item.enabled}
              disabled={!editable}
              aria-label={t("config.switches.toggleNamed", { name: t(`config.switch.${item.id}`) })}
              onCheckedChange={(enable) => setTarget({ item, enable })}
            />
          </li>
        ))}
      </ul>
      {!editable ? (
        <p className="m-0 border-t border-border-soft pt-3 text-xs text-muted-text">
          {t("config.switches.readOnly")}
        </p>
      ) : null}

      <ActionDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={
          target?.enable
            ? t("config.switches.on.title", { name })
            : t("config.switches.off.title", { name })
        }
        impact={target?.enable ? t("config.switches.on.impact") : t("config.switches.off.impact")}
        confirmLabel={target?.enable ? t("config.switches.on") : t("config.switches.off")}
        destructive={target ? !target.enable : false}
        typedConfirmation={target ? !target.enable : false}
        onConfirm={async ({ reason }) => {
          if (target) await setKillSwitch(target.item.id, target.enable, reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return target?.enable ? t("config.switches.turnedOn") : t("config.switches.turnedOff");
        }}
      />
    </SectionCard>
  );
}
