import { Warning } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { EmptyState } from "@/shared/components/EmptyState";
import { SearchBox } from "@/shared/components/SearchBox";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { t } from "@/shared/i18n/t";
import { setBillers, setBillType } from "../api/configApi";
import { configKeys, useBillServices } from "../api/queries";
import {
  countSwitchedOff,
  draftChanges,
  searchBillTypes,
  type Biller,
  type BillerDraft,
} from "../model/billServices";
import { BillersDrawer } from "./BillersDrawer";
import { BillTypeTile } from "./BillTypeTile";

/** The change waiting to be confirmed: one bill type's switch, or the ticks saved in the drawer. */
type Target =
  | { kind: "type"; item: Biller; enabled: boolean }
  | { kind: "billers"; name: string; enable: Biller[]; disable: Biller[]; leavesNone: boolean };

const names = (billers: Biller[]) => billers.map((biller) => biller.name).join(", ");

const NO_DRAFT: BillerDraft = new Map();

/** On/off switches for single bill types and billers. Holding `config:kill_switch` makes them editable. */
export function BillServicesPanel({ editable }: { editable: boolean }) {
  const queryClient = useQueryClient();
  const result = useBillServices();
  const [query, setQuery] = useState("");
  // The bill type last opened in the drawer, the search inside it and its unsaved ticks.
  const [chosen, setChosen] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [billerQuery, setBillerQuery] = useState("");
  const [draft, setDraft] = useState<BillerDraft>(NO_DRAFT);
  const [warnUnsaved, setWarnUnsaved] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const name = target?.kind === "type" ? target.item.name : (target?.name ?? "");
  const turningOff = target?.kind === "type" ? !target.enabled : (target?.disable.length ?? 0) > 0;

  const off = countSwitchedOff(result.data?.groups ?? []);
  const openType = result.data?.groups.find((group) => group.id === chosen);

  function closeDrawer() {
    setDraft(NO_DRAFT);
    setWarnUnsaved(false);
    setOpen(false);
  }

  return (
    <SectionCard
      title={t("config.section.bills")}
      description={t("config.bills.description")}
      actions={
        !result.data?.groups.length ? undefined : off.types + off.billers > 0 ? (
          <StatusBadge tone="danger" label={t("config.bills.offCount", off)} />
        ) : (
          <StatusBadge tone="success" label={t("config.bills.allOn")} />
        )
      }
    >
      <AsyncBody
        query={result}
        isEmpty={(data) => data.groups.length === 0}
        emptyTitle={t("config.bills.empty")}
        emptyDescription={t("config.bills.emptyDescription")}
      >
        {(data) => {
          const found = searchBillTypes(data.groups, query);
          const wanted = query.trim().toLowerCase();
          return (
            <div className="flex flex-col gap-3">
              {!data.enforced ? (
                <p className="m-0 flex items-start gap-2 rounded-md bg-warning-bg p-3 text-xs text-ink">
                  <Warning aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {t("config.bills.notEnforced")}
                </p>
              ) : null}
              <SearchBox
                value={query}
                onChange={setQuery}
                label={t("config.bills.search")}
                placeholder={t("config.bills.search")}
              />
              {found.length === 0 ? <EmptyState title={t("state.noMatches.title")} /> : null}
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {found.map((shown) => {
                  // The search trims billers, so the tile counts come from the whole type.
                  const type = data.groups.find((group) => group.id === shown.id) ?? shown;
                  const byBiller = wanted !== "" && !type.name.toLowerCase().includes(wanted);
                  return (
                    <li key={type.id}>
                      <BillTypeTile
                        type={type}
                        matches={byBiller ? shown.billers.map((biller) => biller.name) : []}
                        editable={editable}
                        onOpen={() => {
                          // A search that found billers carries into the dialog.
                          setBillerQuery(byBiller ? query : "");
                          setChosen(type.id);
                          setOpen(true);
                        }}
                        onChangeType={(enabled) => setTarget({ kind: "type", item: type, enabled })}
                      />
                    </li>
                  );
                })}
              </ul>
              {!editable ? (
                <p className="m-0 border-t border-border-soft pt-3 text-xs text-muted-text">
                  {t("config.switches.readOnly")}
                </p>
              ) : null}
            </div>
          );
        }}
      </AsyncBody>

      {openType ? (
        <BillersDrawer
          // It steps aside while a change is confirmed, so the two never stack.
          open={open && target === null}
          type={openType}
          query={billerQuery}
          onQueryChange={setBillerQuery}
          draft={draft}
          onDraftChange={(next) => {
            setDraft(next);
            setWarnUnsaved(false);
          }}
          warnUnsaved={warnUnsaved}
          editable={editable}
          // Escape, the close button and the backdrop must not throw ticks away.
          onClose={() => {
            const pending = draftChanges(openType.billers, draft);
            if (pending.enable.length + pending.disable.length > 0) setWarnUnsaved(true);
            else closeDrawer();
          }}
          onDiscard={closeDrawer}
          onSave={() => {
            const pending = draftChanges(openType.billers, draft);
            const on = openType.billers.filter((biller) => biller.enabled).length;
            setTarget({
              kind: "billers",
              name: openType.name,
              ...pending,
              leavesNone: on + pending.enable.length - pending.disable.length === 0,
            });
          }}
          onChangeType={(enabled) => setTarget({ kind: "type", item: openType, enabled })}
        />
      ) : null}

      <ActionDialog
        open={target !== null}
        onOpenChange={(next) => !next && setTarget(null)}
        title={
          target?.kind === "billers"
            ? t("config.bills.batch.title", { name })
            : target?.enabled
              ? t("config.bills.on.title", { name })
              : t("config.bills.off.title", { name })
        }
        impact={
          target?.kind === "billers"
            ? t("config.bills.batch.impact")
            : target?.enabled
              ? t("config.bills.on.impact")
              : t("config.bills.off.typeImpact")
        }
        confirmLabel={
          target?.kind === "billers"
            ? t("config.bills.save")
            : target?.enabled
              ? t("config.bills.on")
              : t("config.bills.turnOff")
        }
        destructive={turningOff}
        // Typing the word is asked for when a change leaves a whole bill type unpayable.
        typedConfirmation={target?.kind === "billers" ? target.leavesNone : turningOff}
        onConfirm={async ({ reason }) => {
          let outcome = "";
          if (target?.kind === "type") {
            await setBillType(target.item.id, target.enabled, reason);
            outcome = target.enabled
              ? t("config.bills.turnedOn", { name })
              : t("config.bills.turnedOff", { name });
          } else if (target) {
            await setBillers(
              target.enable.map((biller) => biller.id),
              target.disable.map((biller) => biller.id),
              reason,
            );
            setDraft(NO_DRAFT);
            outcome = t("config.bills.batch.saved", { name });
          }
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return outcome;
        }}
      >
        {target?.kind === "billers" ? (
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto text-sm text-ink">
            {target.disable.length > 0 ? (
              <p className="m-0">
                {t("config.bills.batch.turningOff", {
                  count: target.disable.length,
                  names: names(target.disable),
                })}
              </p>
            ) : null}
            {target.enable.length > 0 ? (
              <p className="m-0">
                {t("config.bills.batch.turningOn", {
                  count: target.enable.length,
                  names: names(target.enable),
                })}
              </p>
            ) : null}
          </div>
        ) : null}
      </ActionDialog>
    </SectionCard>
  );
}
