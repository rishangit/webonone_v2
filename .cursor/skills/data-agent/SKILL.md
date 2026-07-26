---
name: data-agent
description: >-
  Data service agent for webonone-platform. Handles data/ frontend, backend,
  migrations — catalog CRUD for tags, units, attributes, products, services,
  spaces. Use when tasks touch data/, Data API, WebOnOne Data nav handoff, or
  Data create/edit/wizard dialog boxes — also read core-hosted-peer-dialog and
  dialog-windows for any dialog or modal.
---

# Data agent skill

## Scope

- `data/frontend`, `data/backend`, `data/backend/migrations`
- WebOnOne consumer: `webonone-v2/frontend/src/features/data/`
- Platform nav: `packages/platform-nav/src/coreNav.ts` (Data external service)

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — **required**: pages dispatch actions only
- [feature-store skill](../feature-store/SKILL.md) — **required for catalog CRUD**: build each `store/*Store.ts` with `createCatalogFeatureStore` from `@webonone/store-kit` (not hand-written slice + epics); consume via `useEpicCatalogList` / `useEpicCatalogEditor`
- [core-hosted-peer-dialog skill](../core-hosted-peer-dialog/SKILL.md) — **required for any dialog box / dialog window** (create/edit/wizard/selection): host chrome when embedded; also [dialog-windows.mdc](../../rules/dialog-windows.mdc) and [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc)
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — platform handoff + satellite peer nav to Email
- [feature-page-layout.mdc](../../rules/feature-page-layout.mdc) — `FeaturePage` for collection and details routes
- [details-page-cards.mdc](../../rules/details-page-cards.mdc) — profile / inline page-level Edit details ([details-page-cards skill](../details-page-cards/SKILL.md))
- [details-page-wizard-edit.mdc](../../rules/details-page-wizard-edit.mdc) — catalog wizard-backed details (per-card Edit → shared create/edit wizard); [skill](../details-page-wizard-edit/SKILL.md) — **required** for services-style detail + Add dialogs
- [loading-empty-states.mdc](../../rules/loading-empty-states.mdc) — unified AppLayout loading overlay
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3015 | `data/frontend/.env` |
| Backend | 4015 | `data/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_data`.

Peer env for core nav: `VITE_EMAIL_ORIGIN` — see `features/email/utils/emailConfig.ts`.

## Platform loading overlay

Same pattern as Email/WebOnOne — context at `features/auth/context/PlatformLoadingContext.tsx`:

1. `PlatformLoadingProvider` in `app/AppLayout.tsx` — ref-counted registry + 200ms hide-linger.
2. Single overlay; label = `usePlatformOverlayLabel()`. Feed session in via `usePlatformLoading(sessionLoading ? 'Loading session…' : null)` — do not compose the label by hand.
3. `LazyRoute` → `useRouteLoading`; pages → `usePlatformLoading`.
4. Embedded in WebOnOne: `PlatformEmbedLayout` gates its overlay on `usePlatformEmbedContentReady().hasReported` so it never stacks with the shell overlay — see [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc).

Reference: `data/frontend/src/app/AppLayout.tsx`, `data/frontend/src/app/LazyRoute.tsx`, `features/tags/pages/TagsPage.tsx`.

## Core-hosted form dialogs

Catalog create/edit dialogs must use the **peer-dialog** bridge when embedded in WebOnOne (host header + footer; iframe body only). Do not open `CustomDialog` inside `#main-content`.

**Follow:** [core-hosted-peer-dialog skill](../core-hosted-peer-dialog/SKILL.md) · [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) · [dialog-windows.mdc](../../rules/dialog-windows.mdc)

1. Standalone: local `CustomDialog` with matching sizes and footer labels.
2. Embed: `resolvePlatformEmbedParentOrigin` + `useRequestPlatformPeerDialog` + route under `/embed/dialogs/…` (e.g. tags/units/attributes/catalog). Do **not** use URL-only `getPlatformEmbedParentOrigin` on list openers.
3. Embed page: `usePlatformPeerDialogSubmit` + `sendPlatformPeerDialogBusy` / `Complete` — **no** Cancel/Save in the iframe body.
4. Entities with a details page + multi-step create: one dual-use wizard (`id?` + `initialStep`) for list Add/Edit and detail section Edit — [details-page-wizard-edit](../details-page-wizard-edit/SKILL.md). Reference: `ServiceFormDialog` + `ServiceDetailsPage`.

Reference: `features/tags/components/TagFormDialog.tsx`, `features/tags/pages/TagFormEmbedPage.tsx`.

## Cross-service nav (Data → Email)

When core nav includes Email items from Data satellite:

- `features/email/utils/redirectToEmail.ts` + `getEmailRedirectOptions` with `emailNavSentinel`
- `features/shell/utils/externalNavActions.ts` → `withEmailNavActions`
- `AppLayout` `handleEmailNavClick`

## Key paths

- API routes: `data/backend/src/routes/`
- Services: `data/backend/src/services/`
- Admin UI: `data/frontend/src/features/{tags,units,attributes,products,services,spaces}/`
- WebOnOne config: `webonone-v2/frontend/src/features/data/utils/dataConfig.ts`

## Verification

```bash
npm run type-check -w data-root
npm run migrate -w data-root
npm run build -w data-root
```

Platform nav handoff: WebOnOne `AppLayout` → `redirectToData.ts` with `VITE_DATA_ORIGIN`.
