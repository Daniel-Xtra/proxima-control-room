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
    // The layout follows the card's own width, which also changes when the side menu opens.
    <section className="card @container">
      <div className="flex flex-col gap-4 p-4 @xl:flex-row @xl:items-center @xl:gap-8 @xl:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 @xl:gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-muted font-heading text-base font-semibold text-ink @xl:size-16 @xl:text-xl"
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <h2 className="m-0 font-heading text-lg font-semibold wrap-anywhere text-ink @xl:text-xl">
              {name}
            </h2>
            <p className="m-0 mt-1 flex items-start gap-1.5 text-sm text-muted-text">
              <EnvelopeSimple aria-hidden="true" className="mt-px size-4 shrink-0" />
              <span className="min-w-0 wrap-anywhere">{email}</span>
            </p>
          </div>
        </div>
        <dl className="m-0 border-t border-border-soft pt-4 @xl:max-w-1/2 @xl:border-t-0 @xl:border-l @xl:pt-0 @xl:pl-8">
          <div>
            <dt className="text-xs text-muted-text">{t("security.identity.access")}</dt>
            <dd className="m-0 mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink"
                >
                  <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-muted-text" />
                  {role}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
