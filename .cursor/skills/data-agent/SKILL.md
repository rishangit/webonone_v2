---
name: data-agent
description: Data service agent for webonone-platform. Handles data/ frontend, backend, migrations — catalog CRUD for tags, units, attributes, products, services, spaces. Use when tasks touch data/, Data API, or WebOnOne Data nav handoff.
---

# Data agent skill

## Scope

- `data/frontend`, `data/backend`, `data/backend/migrations`
- WebOnOne consumer: `webonone-v2/frontend/src/features/data/`
- Platform nav: `packages/platform-nav/src/coreNav.ts` (Data external service)

## Rules

- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — platform handoff + satellite peer nav to Email
- [loading-empty-states.mdc](../../rules/loading-empty-states.mdc) — unified AppLayout loading overlay
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3005 | `data/frontend/.env` |
| Backend | 4005 | `data/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_data`.

Peer env for core nav: `VITE_EMAIL_ORIGIN` — see `features/email/utils/emailConfig.ts`.

## Platform loading overlay

Same pattern as Email/WebOnOne — context at `features/auth/context/PlatformLoadingContext.tsx`:

1. `PlatformLoadingProvider` in `app/AppLayout.tsx`.
2. Single overlay; label = `sessionLoading ? 'Loading session…' : pageLabel ?? routeLabel`.
3. `LazyRoute` → `useRouteLoading`; pages → `usePlatformLoading`.

Reference: `data/frontend/src/app/AppLayout.tsx`, `data/frontend/src/app/LazyRoute.tsx`, `features/tags/pages/TagsPage.tsx`.

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
