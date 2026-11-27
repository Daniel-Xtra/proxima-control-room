import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { SearchBox } from "@/shared/components/SearchBox";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { Switch } from "@/shared/components/ui/Switch";
import { t } from "@/shared/i18n/t";
import {
  draftChanges,
  searchBillers,
  selectBillers,
  type BillerDraft,
  type BillType,
} from "../model/billServices";
import { BillerChip } from "./BillerChip";

interface Props {
  open: boolean;
  /** The bill type last opened. It stays while the drawer slides shut. */
  type: BillType;
  query: string;
  onQueryChange: (query: string) => void;
  /** Ticks that differ from what is saved. */
  draft: BillerDraft;
  onDraftChange: (draft: BillerDraft) => void;
  /** True once the admin has tried to close with unsaved ticks. */
  warnUnsaved: boolean;
  editable: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onChangeType: (enabled: boolean) => void;
}

/** The billers of one bill type. Admins tick several, then save them together. */
export function BillersDrawer({
  open,
  type,
  query,
  onQueryChange,
  draft,
  onDraftChange,
  warnUnsaved,
  editable,
  onClose,
  onDiscard,
  onSave,
  onChangeType,
}: Props) {
  const shown = searchBillers(type.billers, query);
  const ticked = (id: number, saved: boolean) => draft.get(id) ?? saved;
  const selected = type.billers.filter((biller) => ticked(biller.id, biller.enabled)).length;
  const allShown = shown.length > 0 && shown.every((biller) => ticked(biller.id, biller.enabled));
  const changes = draftChanges(type.billers, draft);
  const dirty = changes.enable.length + changes.disable.length > 0;

  return (
    <DetailsSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      size="md"
      title={type.name}
      description={t("config.bills.billerCount", {
        on: type.billers.filter((biller) => biller.enabled).length,
        total: type.billers.length,
      })}
      action={
        editable ? (
          <>
            <p
              role={warnUnsaved && dirty ? "alert" : "status"}
              className="m-0 mr-auto w-full text-xs text-muted-text"
            >
              {!dirty ? (
                t("config.bills.noChanges")
              ) : (
                <>
                  <span className="block text-ink">
                    {t("config.bills.pending", {
                      on: changes.enable.length,
                      off: changes.disable.length,
                    })}
                  </span>
                  {warnUnsaved ? (
                    <span className="block text-warning-text">{t("config.bills.unsaved")}</span>
                  ) : null}
                </>
              )}
            </p>
            <Button variant="outline" onClick={onDiscard}>
              {dirty ? t("config.bills.discard") : t("common.close")}
            </Button>
            <Button disabled={!dirty} onClick={onSave}>
              {t("config.bills.save")}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-4 py-3 text-sm font-medium">
          {t("config.bills.wholeType")}
          <Switch
            checked={type.enabled}
            disabled={!editable}
            aria-label={t("config.bills.toggleNamed", { name: type.name })}
            onCheckedChange={onChangeType}
          />
        </label>
        {!type.enabled ? (
          <p className="m-0 text-xs text-muted-text">{t("config.bills.typeOffNote")}</p>
        ) : null}
        <SearchBox
          value={query}
          onChange={onQueryChange}
          label={t("config.bills.searchBillers")}
          placeholder={t("config.bills.searchBillers")}
          className="shrink-0 sm:max-w-none"
        />
        {shown.length === 0 ? (
          <p className="m-0 text-xs text-muted-text">
            {type.billers.length === 0 ? t("config.bills.noBillers") : t("state.noMatches.title")}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-2">
              <label className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={allShown}
                  disabled={!editable}
                  onChange={(event) =>
                    onDraftChange(selectBillers(draft, shown, event.target.checked))
                  }
                />
                {query.trim() ? t("config.bills.selectAllShown") : t("config.bills.selectAll")}
              </label>
              <span className="text-xs text-muted-text">
                {t("config.bills.selected", { selected, total: type.billers.length })}
              </span>
            </div>
            <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {shown.map((biller) => {
                const enabled = ticked(biller.id, biller.enabled);
                return (
                  <li key={biller.id} className="flex max-w-full">
                    <BillerChip
                      item={{ ...biller, enabled }}
                      changed={enabled !== biller.enabled}
                      typeOff={!type.enabled}
                      editable={editable}
                      onChange={(next) => onDraftChange(selectBillers(draft, [biller], next))}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </DetailsSheet>
  );
}
