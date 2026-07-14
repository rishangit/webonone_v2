---
name: identity-agent
description: >-
  Identity service agent for webonone-platform. Handles identity/ frontend,
  backend, and migrations — auth UI, JWT issuance, embed mode. Use when tasks
  touch identity/, auth routes, login/register/reset, or JWT signing.
---

# Identity service agent

**Subagent:** [.cursor/agents/identity-agent.md](../../agents/identity-agent.md)

## Scope

**Allowed paths:** `identity/` only.

**Do not edit:** `ui-kit/`, `webonone-v2/`, or another service's `.env`.

## Frontend layout (match data/email)

```text
identity/frontend/src/
  app/           # store, router, AppLayout
  features/      # auth, profile, shell — domain UI + store/epics per feature
  shared/
    services/    # apiClient.ts, authApi.ts — HTTP only; called from epics
    store/       # cacheUtils.ts, shared store factories
    types/       # auth.types.ts and cross-feature DTOs
```

Wire `initApiClient(store)` in `app/store/index.ts`. Epics import `@/shared/services/authApi`; pages dispatch actions only.

## Rules

- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — store/epics
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — Express/JWT
- [identity-project.mdc](../../rules/identity-project.mdc) — service globs
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — embed mode from WebOnOne (`PlatformEmbedLayout`); redirect handoff from satellites
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — boundaries

## Verification

From repo root:

```bash
npm run type-check -w identity-root
```

From `identity/`:

```bash
npm run migrate
npm run dev
```

Optional: `npm run lint` in `identity/frontend` and `identity/backend` if you changed those packages.

## Return format

Summarize: files changed, verification results, and any follow-up needed in WebOnOne or UI Kit.
