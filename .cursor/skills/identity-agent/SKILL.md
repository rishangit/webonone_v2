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
- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — store/epics. Standard list/detail CRUD uses `@webonone/store-kit` — see [feature-store skill](../feature-store/SKILL.md) (bespoke `users` search/role list stays hand-written)
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — Express/JWT
- [identity-project.mdc](../../rules/identity-project.mdc) — service globs
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — embed mode from WebOnOne (`PlatformEmbedLayout`); redirect handoff from satellites
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — boundaries

## Embedded peer dialogs

When Identity is embedded in WebOnOne and a dialog must feel core-owned, do **not** render `CustomDialog` inside the Identity page iframe.

| Dialog type | Contract | Notes |
|-------------|----------|-------|
| **Media** (profile photo, etc.) | `media-dialog-*` | Host mounts Media frames — see `ProfileMediaSelectorModal.tsx` |
| **Peer-owned forms** (future Identity CRUD modals) | `peer-dialog-*` | Host header/footer + `/embed/dialogs/…` body — same recipe as Email/Data in [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) |

Standalone: keep local `CustomDialog` (header / body / footer) when `parentOrigin` is absent.

Reference: `identity/frontend/src/features/profile/components/ProfileMediaSelectorModal.tsx` (media); Email `TemplateFormDialog.tsx` (peer form pattern).

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
