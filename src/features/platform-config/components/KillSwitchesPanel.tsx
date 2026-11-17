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
  // `stop` is true when the switch is being engaged, which blocks the flow.
  const [target, setTarget] = useState<{ item: KillSwitch; stop: boolean } | null>(null);
  const stopped = switches.filter((item) => item.engaged).length;
  const name = target?.item.name ?? "";

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
                {item.name}
                <StatusBadge
                  tone={item.engaged ? "danger" : "success"}
                  label={item.engaged ? t("config.state.stopped") : t("config.state.running")}
                />
              </p>
              {item.description ? (
                <p className="m-0 text-xs text-muted-text">{item.description}</p>
              ) : null}
              {item.changedAt ? (
                <p className="m-0 text-xs text-muted-text">
                  {t("config.switches.changed", {
                    name: item.changedByName ?? t("common.notAvailable"),
                  })}{" "}
                  · <DateText iso={item.changedAt} />
                  {item.reason ? ` · ${item.reason}` : ""}
                </p>
              ) : null}
            </div>
            <Switch
              checked={!item.engaged}
              disabled={!editable}
              aria-label={t("config.switches.toggleNamed", { name: item.name })}
              onCheckedChange={(running) => setTarget({ item, stop: !running })}
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
          target?.stop
            ? t("config.switches.off.title", { name })
            : t("config.switches.on.title", { name })
        }
        impact={target?.stop ? t("config.switches.off.impact") : t("config.switches.on.impact")}
        confirmLabel={target?.stop ? t("config.switches.off") : t("config.switches.on")}
        destructive={target?.stop ?? false}
        typedConfirmation={target?.stop ?? false}
        onConfirm={async ({ reason }) => {
          if (target) await setKillSwitch(target.item.id, target.stop, reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return target?.stop ? t("config.switches.turnedOff") : t("config.switches.turnedOn");
        }}
      />
    </SectionCard>
  );
}
