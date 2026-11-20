# Proxima Control Room

Back-office admin console for the Proxima fintech platform. Staff use it to manage customers, transactions, account requests, savings, bulk transfers, broadcasts, platform configuration, and risk controls.

> **Status:** front-end only. There is no backend yet; every API call is a simulated mock (see [Mock API layer](#mock-api-layer)).

## Stack

- React 19, TypeScript, Vite, Tailwind CSS 4
- React Router 7, TanStack Query 5
- Radix UI primitives wrapped in `src/shared/components/ui` (shadcn-style)
- Phosphor icons, Sonner toasts, `read-excel-file` for payee uploads
- pnpm, oxlint, prettier, husky + lint-staged
- Deployed on Vercel (SPA rewrite in `vercel.json`)

## Getting started

```bash
pnpm install
pnpm dev
```

| Script              | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Start the Vite dev server                                |
| `pnpm build`        | Typecheck, then build for production                     |
| `pnpm preview`      | Serve the production build locally                       |
| `pnpm lint`         | Run oxlint (warnings are errors)                         |
| `pnpm format`       | Format with prettier (`format:check` to verify only)     |
| `pnpm typecheck`    | Run `tsc --noEmit`                                       |
| `pnpm check:colors` | Fail if colour literals appear outside `tokens.css`      |
| `pnpm check`        | Lint, format check, typecheck and colour check in one go |

Husky runs lint-staged on commit and checks on push.

## Project structure

The `@/` alias points to `src/`.

```
src/
  app/        App.tsx (providers + all routes), layouts (AppShell, Sidebar, navItems), styles (tokens.css)
  features/   One folder per domain, each with api/, components/, model/, pages/ and an index.ts barrel
  shared/     api/ (client, audit, events, fixtures), components/, hooks/, i18n/, lib/
```

Features: `access`, `auth`, `broadcasts`, `bulk-transfers`, `content`, `customers`, `overview`, `platform-config`, `requests`, `risk`, `savings`, `system-health`, `transactions`.

## Architecture

### Mock API layer

`shared/api/client.ts` defines the real `{ message, data }` envelope, `ApiError` and `Page<T>`. `simulate()` adds latency and error shapes. Each feature's `*Api.ts` keeps a lazily built in-memory store seeded from `mockFixtures`, so data resets on reload. Wiring in the real backend should only touch these files.

`shared/api/domainEvents.ts` is a small pub/sub that lets mock APIs react to each other without importing one another (for example, an approved freeze request updates the customer record).

### Auth and permissions (RBAC)

- Permissions are `resource:action` strings grouped by module in `features/auth/model/permissions.ts`; roles are bundles of permissions (`roleTemplates.ts`).
- Routes are guarded with `<RequirePermission>` in `App.tsx`; in-page gating uses `<Can>`. Sidebar visibility comes from `navAccess.ts`.
- **Segregation of duties** is enforced through the `CONFLICTS` list: a role cannot hold both initiate and approve for the same flow, or both `roles:manage` and `staff:manage`.
- Maker-checker flows apply to requests, bulk transfers and config changes.
- The session lives in `sessionStorage`. `IdleGuard` handles inactivity warnings, and sign-in includes a TOTP step.

### Audit trail

`shared/api/auditStore.ts` is an in-memory audit log. Every privileged action and sensitive-data reveal calls `recordAudit`, and the Audit Log page reads from it. It stands in until an audit API exists.

## UI building blocks

Compose screens from `src/shared/components` before writing new markup. Primitives (Radix wrappers) live in `src/shared/components/ui`.

| Component                                        | Use it for                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `PageHeader`                                     | Page title and actions                                                                             |
| `FilterBar`                                      | Bordered filter panel above a table                                                                |
| `DataTable`                                      | Server-side paginated, sorted table with a column picker                                           |
| `SimpleTable`                                    | Small static tables                                                                                |
| `AsyncBody`                                      | One place for loading, error, forbidden and empty states                                           |
| `ActionDialog`                                   | Every data-changing action: ticket, reason, evidence, authenticator code, result with audit record |
| `StatusBadge` / `BooleanBadge`                   | Status with an icon plus a label, never colour alone                                               |
| `SectionCard`, `KeyValueList`                    | Detail layouts                                                                                     |
| `DetailsSheet`                                   | Right-side drawer for list-to-detail flows                                                         |
| `Timeline`, `Stepper`                            | Event history and multi-step flows                                                                 |
| `StatCard`, `Sparkline`, `TrendChart`, `BarList` | Overview metrics and charts                                                                        |
| `MaskedValue`                                    | Sensitive data, masked until an explicit, audited reveal                                           |
| `MoneyText`, `DateText`                          | Kobo amounts; Africa/Lagos times with the UTC value in the tooltip                                 |
| `FileUpload`, `TotpInput`                        | Evidence picker; six-digit authenticator field                                                     |

## Conventions

- **Colours** may only be defined in `src/app/styles/tokens.css`; `pnpm check:colors` enforces this. Use token utilities such as `bg-surface` and `text-ink`.
- **Theme:** a three-state switch (system, light, dark) in `shared/lib/theme.ts` sets `data-theme` on `<html>`.
- **Typography:** Figtree for body text, Sora for headings, 13 px base.
- **Data formats:** money is integer kobo; times are ISO UTC strings shown in Africa/Lagos.
- Contributor and agent rules, including module boundaries, are in [AGENTS.md](AGENTS.md).
- **UI strings** go through typed i18n keys (`shared/i18n`, per-domain message files), not inline text.
- **Status badges** are built with `defineStatusBadge`.
- **List filters** are kept in the URL via `useUrlFilters`.
- **Data fetching** uses `useApiQuery`; each feature keeps its own query keys in `api/queries.ts`.
- Import features through their `index.ts` barrel.
