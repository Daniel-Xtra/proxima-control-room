import { DotsThree, Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { NO_VALUE } from "@/shared/lib/format";
import { requestTermChange, requestTermCreate } from "../api/settingsApi";
import { savingsSettingsKeys } from "../api/settingsQueries";
import { isAmount, isPercent, koboToNaira, nairaToKobo } from "../model/settingsMoney";
import type { FixedDepositTerm } from "../model/settingsTypes";

interface Props {
  terms: FixedDepositTerm[];
  /** Holds the permission to ask for savings settings changes. */
  editable: boolean;
}

type Dialog = { kind: "add" } | { kind: "edit" | "toggle"; term: FixedDepositTerm } | null;

const MAX_DAYS = 3650;

export function TermsPanel({ terms, editable }: Props) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [days, setDays] = useState("");
  const [interest, setInterest] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const close = () => setDialog(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: savingsSettingsKeys.all });

  function open(next: Dialog) {
    if (next?.kind === "edit") {
      setInterest(String(next.term.interestPercent));
      setMin(koboToNaira(next.term.minKobo));
      setMax(koboToNaira(next.term.maxKobo));
    } else if (next?.kind === "add") {
      setDays("");
      setInterest("");
      setMin("");
      setMax("");
    }
    setDialog(next);
  }

  const minKobo = nairaToKobo(min);
  const maxKobo = max.trim() === "" ? null : nairaToKobo(max);
  const formOk =
    isPercent(interest) &&
    isAmount(min) &&
    isAmount(max) &&
    minKobo > 0 &&
    (maxKobo === null || maxKobo >= minKobo);

  /** Only the fields that differ from the live term, in the API's names. */
  function changesFor(term: FixedDepositTerm): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    if (Number(interest) !== term.interestPercent) changes.interest = Number(interest);
    if (minKobo !== term.minKobo) changes.minimum_amount = minKobo;
    if (maxKobo !== term.maxKobo) changes.maximum_amount = maxKobo;
    return changes;
  }

  const fields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="term-interest">{t("savingsSettings.field.interest")}</Label>
        <Input
          id="term-interest"
          inputMode="decimal"
          value={interest}
          onChange={(event) => setInterest(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="term-min">{t("savingsSettings.field.min")}</Label>
        <Input
          id="term-min"
          inputMode="decimal"
          value={min}
          onChange={(event) => setMin(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="term-max">{t("savingsSettings.field.max")}</Label>
        <Input
          id="term-max"
          inputMode="decimal"
          value={max}
          onChange={(event) => setMax(event.target.value)}
        />
        <p className="m-0 text-xs text-muted-text">{t("savingsSettings.maxHint")}</p>
      </div>
      {maxKobo !== null && minKobo > 0 && maxKobo < minKobo ? (
        <p role="alert" className="m-0 text-sm text-danger-text sm:col-span-2">
          {t("savingsSettings.err.range")}
        </p>
      ) : null}
    </div>
  );

  const edit = dialog?.kind === "edit" ? dialog.term : null;
  const toggle = dialog?.kind === "toggle" ? dialog.term : null;
  const daysNumber = Number(days);
  const daysOk =
    Number.isInteger(daysNumber) &&
    daysNumber >= 1 &&
    daysNumber <= MAX_DAYS &&
    !terms.some((term) => term.days === daysNumber);

  return (
    <SectionCard
      title={t("savingsSettings.terms.title")}
      description={t("savingsSettings.terms.description")}
      flush
      actions={
        editable ? (
          <Button onClick={() => open({ kind: "add" })}>
            <Plus aria-hidden="true" />
            {t("savingsSettings.terms.add")}
          </Button>
        ) : null
      }
    >
      <SimpleTable<FixedDepositTerm>
        storageKey="savings-terms"
        caption={t("savingsSettings.terms.title")}
        rows={terms}
        getRowId={(r) => String(r.id)}
        columns={[
          {
            key: "days",
            header: t("savingsSettings.col.days"),
            cell: (r) => t("savings.days", { count: r.days }),
          },
          {
            key: "interest",
            header: t("savingsSettings.col.interest"),
            align: "right",
            cell: (r) => `${r.interestPercent}%`,
          },
          {
            key: "min",
            header: t("savingsSettings.col.min"),
            align: "right",
            cell: (r) => <MoneyText kobo={r.minKobo} />,
          },
          {
            key: "max",
            header: t("savingsSettings.col.max"),
            align: "right",
            cell: (r) => (r.maxKobo === null ? NO_VALUE : <MoneyText kobo={r.maxKobo} />),
          },
          {
            key: "active",
            header: t("savingsSettings.col.status"),
            cell: (r) => (
              <BooleanBadge
                value={r.active}
                trueLabel={t("savingsSettings.on")}
                falseLabel={t("savingsSettings.off")}
              />
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              editable ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={t("savingsSettings.actionsFor", {
                        name: t("savings.days", { count: r.days }),
                      })}
                    >
                      <DotsThree aria-hidden="true" weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => open({ kind: "edit", term: r })}>
                      {t("savingsSettings.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => open({ kind: "toggle", term: r })}>
                      {r.active ? t("savingsSettings.switchOff") : t("savingsSettings.switchOn")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null,
          },
        ]}
      />

      <ActionDialog
        open={dialog?.kind === "add"}
        onOpenChange={(next) => !next && close()}
        title={t("savingsSettings.term.add.title")}
        impact={t("savingsSettings.submit.impact")}
        confirmLabel={t("savingsSettings.submit")}
        blocked={!formOk || !daysOk}
        onConfirm={async ({ reason }) => {
          await requestTermCreate(
            { days: daysNumber, interestPercent: Number(interest), minKobo, maxKobo },
            reason,
          );
          await refresh();
          return t("savingsSettings.submitted");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="term-days">{t("savingsSettings.field.days")}</Label>
          <Input
            id="term-days"
            inputMode="numeric"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          {days !== "" && !daysOk ? (
            <p role="alert" className="m-0 text-sm text-danger-text">
              {t("savingsSettings.err.days", { max: MAX_DAYS })}
            </p>
          ) : null}
        </div>
        {fields}
      </ActionDialog>

      <ActionDialog
        open={edit !== null}
        onOpenChange={(next) => !next && close()}
        title={t("savingsSettings.term.edit.title")}
        description={edit ? t("savings.days", { count: edit.days }) : undefined}
        impact={t("savingsSettings.submit.impact")}
        confirmLabel={t("savingsSettings.submit")}
        blocked={!formOk || !edit || Object.keys(changesFor(edit)).length === 0}
        onConfirm={async ({ reason }) => {
          if (edit) await requestTermChange(edit.id, changesFor(edit), reason);
          await refresh();
          return t("savingsSettings.submitted");
        }}
      >
        {fields}
      </ActionDialog>

      <ActionDialog
        open={toggle !== null}
        onOpenChange={(next) => !next && close()}
        title={
          toggle?.active
            ? t("savingsSettings.toggle.off.title")
            : t("savingsSettings.toggle.on.title")
        }
        description={toggle ? t("savings.days", { count: toggle.days }) : undefined}
        impact={
          toggle?.active
            ? t("savingsSettings.toggle.off.impact")
            : t("savingsSettings.submit.impact")
        }
        confirmLabel={t("savingsSettings.submit")}
        onConfirm={async ({ reason }) => {
          if (toggle) await requestTermChange(toggle.id, { is_active: !toggle.active }, reason);
          await refresh();
          return t("savingsSettings.submitted");
        }}
      />
    </SectionCard>
  );
}
