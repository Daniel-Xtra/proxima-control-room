import { EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react";
import { initials } from "@/shared/lib/format";

/** Who is signed in: a banner, the initials tile, the name, email and roles. */
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
    <section className="card overflow-hidden">
      <div
        aria-hidden="true"
        className="h-24 bg-linear-to-br from-info-bg via-blue-tint-strong to-blue-tint"
      />
      <div className="px-5 pb-5">
        <span
          aria-hidden="true"
          className="-mt-10 flex size-20 items-center justify-center rounded-2xl bg-primary font-heading text-3xl font-semibold text-on-ink ring-4 ring-card"
        >
          {initials(name)}
        </span>
        <h2 className="m-0 mt-3 truncate font-heading text-lg font-semibold text-ink">{name}</h2>
        <p className="m-0 mt-1 flex items-center gap-1.5 truncate text-sm text-muted-text">
          <EnvelopeSimple aria-hidden="true" className="size-4 shrink-0" />
          {email}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1 rounded-pill border border-blue-border bg-blue-tint px-2.5 py-0.5 text-xs font-medium text-ink"
            >
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
