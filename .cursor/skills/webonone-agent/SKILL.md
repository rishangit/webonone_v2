---
name: webonone-agent
description: >-
  WebOnOne v2 service agent for webonone-platform. Handles webonone-v2/ frontend,
  backend, migrations — iframe login host, JWT verification, product shell. Use
  when tasks touch webonone-v2/, postMessage consumer, or webonone_db.
---

# WebOnOne v2 service agent

**Subagent:** [.cursor/agents/webonone-agent.md](../../agents/webonone-agent.md)

## Scope

**Allowed paths:** `webonone-v2/` only.

**Do not edit:** `identity/`, `ui-kit/` (except noting consumer updates to parent).

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — all API I/O via epics; feature store per domain. Standard list/detail CRUD uses `@webonone/store-kit` factories — see [feature-store skill](../feature-store/SKILL.md) (bespoke flows like `companies` stay hand-written)
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — Express/JWT
- [webonone-v2-project.mdc](../../rules/webonone-v2-project.mdc) — service globs
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — WebOnOne loads Email, Data, Profile in `#main-content` iframe; satellites use redirect handoff
- [feature-page-layout.mdc](../../rules/feature-page-layout.mdc) — `FeaturePage` for routes
- [details-page-cards.mdc](../../rules/details-page-cards.mdc) — inline page-level Edit profile/details ([details-page-cards skill](../details-page-cards/SKILL.md))
- [details-page-wizard-edit.mdc](../../rules/details-page-wizard-edit.mdc) — company profile (and similar): per-card Edit → shared create/edit wizard ([skill](../details-page-wizard-edit/SKILL.md))
- [loading-empty-states.mdc](../../rules/loading-empty-states.mdc) — unified AppLayout loading overlay
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — boundaries

## Platform loading overlay

When adding pages or session gates in WebOnOne core:

1. Wrap `AppLayout` in `PlatformLoadingProvider` (`features/shell/context/PlatformLoadingContext.tsx`) — ref-counted loader registry with 200ms hide-linger.
2. Render **one** `<LoadingState key="platform-loading" overlay />` in `AppLayout`; label = `usePlatformOverlayLabel()` (do not `??`-chain page/route/session by hand).
3. `SessionRoleGate` → `usePlatformLoading('Loading session…')` — always render children.
4. `LazyRoute` → `useRouteLoading('Loading page…')`; Suspense fallback returns `null`.
5. Pages → `usePlatformLoading(loading ? 'Loading …' : null)` — no inline loading text or per-page overlays.

Reference: `webonone-v2/frontend/src/app/AppLayout.tsx`, `features/session/components/SessionRoleGate.tsx`, `app/LazyRoute.tsx`.

## Core-hosted peer dialogs

WebOnOne owns host-level `CustomDialog` chrome for embedded peers. See [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc).

| Kind | Host | When |
|------|------|------|
| **Media** | `PlatformMediaDialogHost` | Media picker/crop (`media-dialog-*`) |
| **Peer forms** | `PlatformPeerDialogHost` | Email/Data/SMS (and future) CRUD forms (`peer-dialog-*`) |

**Peer forms — chrome split:** host = sizes + header + footer (Cancel/`submitLabel`); iframe body = form fields only. Footer Submit → `sendPlatformPeerDialogSubmit`; peer completes via `sendPlatformPeerDialogComplete` / busy via `sendPlatformPeerDialogBusy`.

**New peer dialogs:** no WebOnOne code — peer adds `/embed/dialogs/…` + `useRequestPlatformPeerDialog` (prefix allowlist already on host). Wire `onPeerDialogRequest={openPeerDialog}` on `PlatformPeerFrame` (already done).

**Any dialog from an embedded peer:** agents must follow [core-hosted-peer-dialog](../core-hosted-peer-dialog/SKILL.md) — do not open `CustomDialog` inside `#main-content`.

**Selection + Add new:** host stacks a sibling create dialog via `peer-dialog-nested-request` (`PlatformPeerDialogHost`) — same idea as SelectTag / DataTagCreateFrame. Do not nest create chrome in the picker iframe.

Reference: `features/shell/PlatformPeerDialogHost.tsx`, `features/media/PlatformMediaDialogHost.tsx`, `features/shell/pages/PlatformPeerFrame.tsx`.

## Verification

From repo root:

```bash
npm run type-check -w webonone-v2-root
```

From `webonone-v2/`:

```bash
npm run migrate
npm run dev
```

Login flow manual check: Identity must be running (`npm run dev:identity`).

## Return format

Summarize: files changed, verification results, and whether Identity needs a coordinated change.
