import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Can, useCan } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatCard } from "@/shared/components/StatCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Label } from "@/shared/components/ui/Label";
import { Switch } from "@/shared/components/ui/Switch";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import {
  addWhitelistEntry,
  listWhitelist,
  removeWhitelistEntry,
  updateWhitelistEntry,
  whitelistStatistics,
  type WhitelistEntry,
  type WhitelistInput,
} from "../api/whitelistApi";

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const KEY = ["risk", "whitelist"];

interface Form {
  service: string;
  ip: string;
  note: string;
  priority: string;
  active: boolean;
  /** `datetime-local` value, or empty. */
  expires: string;
}

const BLANK: Form = { service: "", ip: "", note: "", priority: "50", active: true, expires: "" };

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

function toForm(entry: WhitelistEntry): Form {
  return {
    service: entry.service,
    ip: entry.ip,
    note: entry.note,
    priority: String(entry.priority),
    active: entry.active,
    expires: toLocalInput(entry.expiresAt),
  };
}

function toInput(form: Form): WhitelistInput {
  return {
    service: form.service.trim(),
    ip: form.ip.trim(),
    note: form.note.trim(),
    priority: Number(form.priority),
    active: form.active,
    expiresAt: form.expires ? new Date(form.expires).toISOString() : null,
  };
}

function status(entry: WhitelistEntry) {
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return "expired";
  return entry.active ? "active" : "inactive";
}

export function WebhookWhitelistPage() {
  const queryClient = useQueryClient();
  const can = useCan();
  const query = useApiQuery(KEY, listWhitelist, { staleTime: 0 });
  const stats = useApiQuery([...KEY, "stats"], whitelistStatistics, { staleTime: 0 });
  // `null` means the form is closed; an entry means editing it; "new" means adding.
  const [editing, setEditing] = useState<WhitelistEntry | "new" | null>(null);
  const [removing, setRemoving] = useState<WhitelistEntry | null>(null);
  const [form, setForm] = useState<Form>(BLANK);
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));

  const priority = Number(form.priority);
  const valid =
    form.service.trim() !== "" &&
    IPV4.test(form.ip.trim()) &&
    form.note.trim() !== "" &&
    Number.isInteger(priority) &&
    priority >= 1 &&
    priority <= 100;

  function open(target: WhitelistEntry | "new") {
    setForm(target === "new" ? BLANK : toForm(target));
    setEditing(target);
  }

  return (
    <>
      <PageHeader
        title={t("whitelist.title")}
        crumbs={[{ label: t("nav.group.risk") }, { label: t("whitelist.title") }]}
        description={t("whitelist.description")}
        actions={
          <Can permission="integrations:manage">
            <Button onClick={() => open("new")}>
              <Plus aria-hidden="true" />
              {t("whitelist.add")}
            </Button>
          </Can>
        }
      />
      <AsyncBody
        query={query}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={t("whitelist.empty")}
      >
        {(rows) => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("whitelist.stats.total")}
                value={stats.data?.reduce((sum, item) => sum + item.count, 0) ?? "–"}
              />
              <StatCard label={t("whitelist.stats.services")} value={stats.data?.length ?? "–"} />
            </div>
            {stats.data && stats.data.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-xs text-muted-text">
                {stats.data.map((item) => (
                  <li key={item.service} className="rounded-full border border-border px-3 py-1">
                    {item.service} · {item.count}
                  </li>
                ))}
              </ul>
            ) : null}
            <SectionCard flush>
              <SimpleTable<WhitelistEntry>
                caption={t("whitelist.title")}
                rows={rows}
                getRowId={(r) => r.id}
                columns={[
                  {
                    key: "service",
                    header: t("whitelist.col.service"),
                    sortValue: (r: { service: string }) => r.service,
                    cell: (r) => r.service,
                  },
                  {
                    key: "ip",
                    header: t("audit.ip"),
                    sortValue: (r: { ip: string }) => r.ip,
                    cell: (r) => <span className="tabular">{r.ip}</span>,
                  },
                  { key: "note", header: t("whitelist.col.note"), cell: (r) => r.note },
                  {
                    key: "priority",
                    header: t("whitelist.col.priority"),
                    align: "right",
                    sortValue: (r: { priority: number }) => r.priority,
                    cell: (r) => r.priority,
                  },
                  {
                    key: "status",
                    header: t("whitelist.col.status"),
                    cell: (r) => {
                      const state = status(r);
                      return (
                        <StatusBadge
                          tone={
                            state === "active"
                              ? "success"
                              : state === "expired"
                                ? "danger"
                                : "neutral"
                          }
                          label={t(`whitelist.status.${state}`)}
                        />
                      );
                    },
                  },
                  {
                    key: "expires",
                    header: t("whitelist.col.expires"),
                    cell: (r) =>
                      r.expiresAt ? <DateText iso={r.expiresAt} /> : t("whitelist.never"),
                  },
                  { key: "by", header: t("whitelist.col.addedBy"), cell: (r) => r.addedBy },
                  {
                    key: "at",
                    header: t("whitelist.col.addedAt"),
                    sortValue: (r: { addedAt: string }) => r.addedAt,
                    cell: (r) => <DateText iso={r.addedAt} dateOnly />,
                  },
                  {
                    key: "actions",
                    header: "",
                    align: "right",
                    cell: (r) =>
                      can("integrations:manage") ? (
                        <span className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("whitelist.editNamed", { ip: r.ip })}
                            onClick={() => open(r)}
                          >
                            <PencilSimple aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("whitelist.removeNamed", { ip: r.ip })}
                            onClick={() => setRemoving(r)}
                          >
                            <Trash aria-hidden="true" />
                          </Button>
                        </span>
                      ) : null,
                  },
                ]}
              />
            </SectionCard>
          </div>
        )}
      </AsyncBody>

      <ActionDialog
        open={editing !== null}
        onOpenChange={(next) => !next && setEditing(null)}
        title={editing === "new" ? t("whitelist.add") : t("whitelist.edit")}
        description={
          editing && editing !== "new" ? `${editing.service} · ${editing.ip}` : undefined
        }
        impact={editing === "new" ? t("whitelist.addImpact") : t("whitelist.editImpact")}
        confirmLabel={editing === "new" ? t("whitelist.add") : t("common.save")}
        blocked={!valid}
        onConfirm={async () => {
          if (editing === "new") await addWhitelistEntry(toInput(form));
          else if (editing) await updateWhitelistEntry(editing.id, toInput(form));
          await refresh();
          return editing === "new" ? t("whitelist.added") : t("whitelist.edited");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-service">{t("whitelist.col.service")}</Label>
          <Input
            id="wl-service"
            value={form.service}
            onChange={(e) => set({ service: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-ip">{t("audit.ip")}</Label>
          <Input
            id="wl-ip"
            inputMode="decimal"
            placeholder="102.89.34.17"
            value={form.ip}
            onChange={(e) => set({ ip: e.target.value })}
            aria-invalid={form.ip !== "" && !IPV4.test(form.ip.trim())}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wl-note">{t("whitelist.col.note")}</Label>
          <Input id="wl-note" value={form.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wl-priority">{t("whitelist.col.priority")}</Label>
            <Input
              id="wl-priority"
              type="number"
              min={1}
              max={100}
              value={form.priority}
              onChange={(e) => set({ priority: e.target.value })}
            />
            <p className="text-xs text-muted-text">{t("whitelist.priorityHelp")}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wl-expires">{t("whitelist.col.expires")}</Label>
            <Input
              id="wl-expires"
              type="datetime-local"
              value={form.expires}
              onChange={(e) => set({ expires: e.target.value })}
            />
            <p className="text-xs text-muted-text">{t("whitelist.expiresHelp")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="wl-active"
            checked={form.active}
            onCheckedChange={(active) => set({ active })}
          />
          <Label htmlFor="wl-active">{t("whitelist.activeLabel")}</Label>
        </div>
      </ActionDialog>

      <ActionDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("whitelist.remove")}
        description={removing ? `${removing.service} · ${removing.ip}` : undefined}
        impact={t("whitelist.removeImpact")}
        confirmLabel={t("whitelist.remove")}
        typedConfirmation
        destructive
        onConfirm={async () => {
          if (removing) await removeWhitelistEntry(removing.id);
          await refresh();
          return t("whitelist.removed");
        }}
      />
    </>
  );
}
