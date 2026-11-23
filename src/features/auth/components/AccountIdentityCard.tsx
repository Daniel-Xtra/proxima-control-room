import { EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react";
import { t } from "@/shared/i18n/t";
import { initials } from "@/shared/lib/format";

/** Who is signed in: the initials, name and email on the left, and their access on the right. */
export function AccountIdentityCard({
  name,
  email,
  roles,
}: {
  name: string;
  email: string;
  roles: string[];
}) {
  return (
    <section className="card flex flex-wrap items-center gap-x-8 gap-y-5 p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-muted font-heading text-xl font-semibold text-ink"
        >
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h2 className="m-0 truncate font-heading text-xl font-semibold text-ink">{name}</h2>
          <p className="m-0 mt-1 flex items-center gap-1.5 truncate text-sm text-muted-text">
            <EnvelopeSimple aria-hidden="true" className="size-4 shrink-0" />
            {email}
          </p>
        </div>
      </div>
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3 sm:border-l sm:border-border-soft sm:pl-8">
        <div>
          <dt className="text-xs text-muted-text">{t("security.identity.access")}</dt>
          <dd className="m-0 mt-1.5 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink"
              >
                <ShieldCheck aria-hidden="true" className="size-4 text-muted-text" />
                {role}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
