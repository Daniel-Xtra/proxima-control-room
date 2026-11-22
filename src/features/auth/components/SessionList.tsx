import { DeviceMobile, Desktop } from "@phosphor-icons/react";
import { DateText } from "@/shared/components/DateText";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { t } from "@/shared/i18n/t";
import type { SessionRow } from "../api/sessionsApi";
import { describeDevice } from "../utils/describeDevice";

/** Signed-in devices as a readable list: browser and system, where from, and when last active. */
export function SessionList({ rows }: { rows: SessionRow[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-border-soft p-0">
      {rows.map((row) => {
        const { label, mobile } = describeDevice(row.device);
        const Glyph = mobile ? DeviceMobile : Desktop;
        return (
          <li key={row.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-text"
            >
              <Glyph className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium text-ink" title={row.device}>
                {label}
              </p>
              <p className="m-0 mt-0.5 text-xs text-muted-text">
                {row.ip.replace(/^::ffff:/, "")} · {t("security.lastActive")}{" "}
                <DateText iso={row.lastActive} />
              </p>
            </div>
            <StatusBadge
              tone={row.current ? "success" : "neutral"}
              label={row.current ? t("security.thisDevice") : t("security.signedIn")}
            />
          </li>
        );
      })}
    </ul>
  );
}
