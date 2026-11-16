# Project instructions for all agents

Read and follow this file before creating or changing project code. These rules
apply throughout this repository, including work performed by delegated agents.

## Feature module structure

- `src/main.tsx`: browser entry point only.
- `src/app/`: application composition, routing, providers, layouts, theme, and
  global styles. Keep business logic inside its owning feature.
- `src/features/<feature>/`: code owned by a business capability (for example,
  `orders`, `customers`, or `auth`). Use lowercase kebab-case feature names.
- `src/shared/`: reusable, domain-independent code used across features.
- `public/`: assets that require stable public URLs.

Each feature exposes its supported interface through `index.ts`. Other features
and the app must import from that entry point instead of reaching into internal
files. Within a feature, use direct relative imports; do not import its own barrel.

Create feature subfolders only when needed:

```text
src/features/<feature>/
  index.ts
  pages/          # Route-level screens
  components/     # Feature-specific UI
  hooks/          # Feature-specific React hooks
  api/            # Requests and response mapping
  model/          # Domain types, state, validation, business rules
  utils/          # Feature-specific helpers
  assets/         # Feature-specific images and other assets
```

Keep styles and tests beside the files they cover. Use PascalCase for React
component filenames and camelCase for other TypeScript files. Do not create
empty placeholder modules or speculative feature folders.

## Dependency boundaries

- Dependencies flow from `app` to `features` to `shared`.
- `shared` must not import from `features` or `app`.
- Features must not import from `app`.
- Prefer composing features in `app` over coupling them together. When a feature
  dependency is necessary, use its public entry point and avoid circular imports.
- Keep code in its feature until it has an actual cross-feature use. Place shared
  UI in `shared/components`, transport clients in `shared/api`, and other reusable
  code in appropriately named shared subfolders as needed.
- Do not create global `src/components`, `src/hooks`, `src/services`, or
  `src/types` folders for feature-specific code.

## UI conventions

- Build UI from Radix primitives wrapped in `src/shared/components/ui` (shadcn style) and
  Tailwind CSS v4 utilities. Compose screens from `src/shared/components` before
  writing new markup: `PageHeader`, `FilterBar`, `DataTable`, `SimpleTable`,
  `AsyncBody`, `ActionDialog`, `StatusBadge`, `SectionCard`, `KeyValueList`,
  `Timeline`, `StatCard`. Browse `src/shared/components` for the rest before
  adding a new component.
- Icons: use `@phosphor-icons/react` for new icons and `AppIcon` for the bundled
  PNG icons. Do not add new `lucide-react` imports. Icons are `aria-hidden`;
  an icon-only button needs an accessible label.
- Fonts: Figtree for body text (`--font-sans`) and Sora for headings
  (`--font-heading`), loaded in `index.html`. The type scale is reduced (base
  13 px) and set in `src/app/styles/index.css`.
- Colours, shadows and radii are tokens in `src/app/styles/tokens.css` (light values with
  a dark override). Use token utilities only (`bg-surface`, `text-ink`,
  `text-muted-text`, `border-border`, `bg-info-bg`). Never write hex, `rgb()` or
  `hsl()` literals: `pnpm check:colors` rejects them. Dark mode is set by
  `data-theme` on `<html>`; the three-state switch (system, light, dark) lives in
  `src/shared/lib/theme.ts`, and "system" follows `prefers-color-scheme`.
- Status is never shown by colour alone. Use `StatusBadge`, `BooleanBadge` or a
  badge from `defineStatusBadge`, which pair an icon with a label.
- Every user-facing string goes through `t()` with a typed key in
  `src/shared/i18n/messages.ts`, whose sections live in
  `src/shared/i18n/messages/`. Do not hard-code text in components.
- Any action that changes data goes through `ActionDialog` (ticket reference, reason,
  evidence, outcome). Dialogs are `DialogHeader`, then `DialogBody` (scrolls), then
  `DialogFooter`, and are always titled.
- Read server data with TanStack Query through `useApiQuery` (`shared/hooks`). A feature
  keeps its query keys and query hooks in `features/<name>/api/` (see `access`) and calls
  the typed functions in `shared/api`; after a change, invalidate the feature's keys instead
  of reloading by hand. Render the result with `AsyncBody`, so loading, error, empty and
  forbidden states look the same everywhere.
- Money is integer kobo, shown with `MoneyText` or `formatKobo`. Times are ISO UTC
  strings, shown in Africa/Lagos on a 12-hour clock with `DateText` or
  `formatLagos`. Mask personal data for display with `maskEmail` and `maskTail`.
- Use `toast` from `sonner` for transient feedback; the one `Toaster` is
  `src/shared/components/ui/Sonner.tsx`. Do not add another toast library. Keep messages
  short. `ActionDialog` already toasts on success, so do not toast twice.
- Files that export components export only components, so React Fast Refresh keeps
  working. Put constants and helpers in a sibling `.ts` file.

## Verification

Use pnpm and keep `pnpm-lock.yaml` updated when changing dependencies. On Windows,
use `pnpm.cmd` if PowerShell blocks the `pnpm.ps1` shim.

Use Oxlint for code quality and Prettier for formatting. Follow `.oxlintrc.json`
and `.prettierrc.json`; do not add competing formatters or disable rules just to
make checks pass. React uses the automatic JSX runtime. CSS and font side-effect
imports are intentional. Warnings fail lint checks.

Run `pnpm format` to format files and `pnpm lint:fix` for safe lint fixes.
The Husky pre-commit hook runs lint-staged: staged JavaScript/TypeScript files are
linted and formatted; staged supported document/style/config files are formatted.
The Husky pre-push hook runs `pnpm check` and `pnpm build`, so a push is blocked
unless lint, formatting, types, and the production build all pass.
Do not bypass hooks to commit or push failing code.

After code or structural changes, run `pnpm check` and `pnpm build`.
Preserve existing behavior unless the task requests a behavior change.
