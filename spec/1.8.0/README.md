# WebOnOne Platform — Specification (1.8.0)

Extends [1.7.0](../1.7.0/README.md) with a **consistent feature-page layout** inside the `AppShell` main content area — shared **`FeaturePage`** / **`PageHeader`** primitives in UI Kit, consumer refactors in WebOnOne v2, **Identity dual sidebar navigation** (standalone vs core redirect), and a **Cursor rule** so new feature pages follow the same structure.

## Revision history

- **Subtask 86ey33zeu (initial)** — Identity `AppShell` left nav for standalone mode.
- **Subtask 86ey33zeu (refinement)** — Dual nav modes: Identity nav only when standalone; **full core/WebOnOne nav only** when `return_url` is present. Shared path contract in `@webonone/platform-nav` (`coreNav.ts`); `core_nav` query param for super-admin variant.
- **Subtask 86ey342mv** — Standalone Identity `/login` shows **welcome page** inside `AppShell` with left navigation; embed/redirect login keeps centered `PageShell` (no sidebar).

Implementation branch: **`spec/1.8.0`**

**Spec No:** 1.8.0

## What changed from 1.7.0

| Area | 1.7.0 | 1.8.0 |
|------|-------|-------|
| Feature page layout | Ad-hoc per page (`space-y-8`, mixed `max-w-*`, mixed title sizes) | Shared **`FeaturePage`** + **`PageHeader`** from `@webonone/ui-kit` |
| Title block | Inline `<h1>` / `<p>` duplicated | Standard header: title + optional description + optional actions |
| Content width | Some pages centered (`mx-auto max-w-*`), others full-bleed | Full width of shell main content (`w-full`); no per-page `max-w-*` on `FeaturePage` |
| Title → body gap | Inconsistent (`mt-1`, `mt-2`, `space-y-6`, `space-y-8`) | Fixed **`gap-6`** between header and page body |
| Agent guidance | None for page chrome | **`.cursor/rules/feature-page-layout.mdc`** |
| Identity navigation | No sidebar; inline back link on profile redirect | Dual mode: Identity nav **or** core nav (mutually exclusive) via `return_url` |

## Projects affected

| Project | Role in 1.8.0 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | Export `FeaturePage`, `PageHeader`; showcase demo |
| **WebOnOne v2** (`webonone-v2/frontend/`) | Refactor feature pages to `FeaturePage`; shared nav paths; profile redirect passes `core_nav` |
| **Identity** (`identity/frontend/`) | Dual `AppShell` sidebar: Identity nav (standalone) or core nav (redirect) |
| **Platform nav** (`packages/platform-nav/`) | `coreNav.ts` — shared core platform path trees and URL resolver |
| **Cursor rules** (`.cursor/rules/`) | New `feature-page-layout.mdc`; index entry in `README.md` |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-feature-page-layout.md](./02-feature-page-layout.md) | `FeaturePage` / `PageHeader` API, spacing tokens, consumer contract |
| [03-cursor-rule.md](./03-cursor-rule.md) | `feature-page-layout.mdc` requirements and verification |
| [04-identity-navigation.md](./04-identity-navigation.md) | Identity dual sidebar modes + `@webonone/platform-nav` core nav contract |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec 1.8.0 | 86ey2ymnf | All docs |
| spaces and gaps | 86ey2ymt2 | [02](./02-feature-page-layout.md), [03](./03-cursor-rule.md); Phases 1–4 |
| need to have the left navigation for the identity service | 86ey33zeu | [04](./04-identity-navigation.md); Phase 5 |
| identity project stand alone loggin need to have the welcome page | 86ey342mv | [04](./04-identity-navigation.md); Phase 6 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.2.0/03-app-shell-navigation.md](../1.2.0/03-app-shell-navigation.md) | `AppShell` main content area (`#main-content`) |
| [../1.7.0/README.md](../1.7.0/README.md) | Latest UI Kit export patterns |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` — layout lives in UI Kit; consumers import from `@webonone/ui-kit` |
| Front-end structure | `front-end-structure.mdc` — feature pages under `features/*/pages/` |
| Code style | `code-cleanliness.mdc` — `@/` aliases in consumers |
| Feature page layout | `feature-page-layout.mdc` (new in 1.8.0) |

## Local dev

```bash
npm run dev:webonone    # WebOnOne :3000 — verify settings pages
npm run dev:identity    # Identity :3001 — verify standalone nav
npm run dev:ui-kit      # Showcase :3002 — FeaturePage demo
npm run build -w @webonone/ui-kit
npm run build -w @webonone/platform-nav
```
