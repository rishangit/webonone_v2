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

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — all API I/O via epics; feature store per domain
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — Express/JWT
- [webonone-v2-project.mdc](../../rules/webonone-v2-project.mdc) — service globs
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — WebOnOne loads Email, Data, Profile in `#main-content` iframe; satellites use redirect handoff
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
