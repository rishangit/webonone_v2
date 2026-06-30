# WebOnOne Platform — Specification (1.9.2)

Adds a reusable **`Pagination`** component to `@webonone/ui-kit` so list screens across services can navigate large datasets with consistent controls, record-range summary, and optional page-size selection.

**Spec No:** 1.9.2

Implementation branch: **`spec/1.9.2`**

## What changed from 1.9.1

| Area | 1.9.1 | 1.9.2 |
|------|-------|-------|
| List navigation | Ad-hoc Previous/Next buttons per page (e.g. Email History) | Shared `Pagination` in UI Kit |
| Page size | Fixed per screen | Configurable via `pageSize` + `onPageSizeChange` |
| Record summary | Inline copy varies by screen | Standard “Showing X–Y of Z” |
| Showcase | — | Pagination demo on **Components** tab with ItemList |
| Service lists | Ad-hoc or none | `Pagination` on Email, WebOnOne, Media list pages |
| Agent guidance | item-list skill only | + `item-list-pagination.mdc` rule |

## Projects affected

| Project | Role in 1.9.2 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | `Pagination` component; Components tab demo |
| **Email** (`email/`) | History, Queue, Templates pagination |
| **WebOnOne v2** (`webonone-v2/`) | Companies, System Theme lists |
| **Media** (`media/`) | Folder browser media items |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-ui-kit-pagination.md](./02-ui-kit-pagination.md) | Component API, behavior, styling, edge cases |
| [03-showcase-components-pagination.md](./03-showcase-components-pagination.md) | Components tab demo |
| [04-service-pagination-rollout.md](./04-service-pagination-rollout.md) | Cross-service adoption + cursor rule |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## Revision history

- **Subtask 86ey3ypk3** — Pagination demo on Components showcase tab (with ItemList); remove Controls duplicate.
- **Subtask 86ey3ykth (revision)** — Audit Email + WebOnOne for remaining list surfaces; Dashboard recent via `getHistory`; Template editor version pagination.

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.9.2 Add pagination to the UI-kit | 86ey3yh8p | All docs |
| Define the pagination | 86ey3yjxz | [02-ui-kit-pagination.md](./02-ui-kit-pagination.md), Phase 1 in [07-implementation-plan.md](./07-implementation-plan.md) |
| need to add the pagination to the ui-kit component show case | 86ey3ypk3 | [03-showcase-components-pagination.md](./03-showcase-components-pagination.md), Phase 4 |
| Implement the pagination to the services | 86ey3ykth | [04-service-pagination-rollout.md](./04-service-pagination-rollout.md), Phases 5–6 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.1/04-ui-kit-otp-input.md](../1.9.1/04-ui-kit-otp-input.md) | UI Kit component + showcase pattern |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | Feature pages that host paginated lists |
| [../1.9.0/04-management-screens.md](../1.9.0/04-management-screens.md) | History list baseline (consumer) |

## Rules reference

| Topic | Rule |
|-------|------|
| UI Kit scope | `ui-kit-project.mdc` |
| Consumer usage | `ui-kit-consumption.mdc` |
| List + pagination | `item-list-pagination.mdc` |

## Local dev

```bash
npm run dev:ui-kit       # Showcase — Pagination demo
npm run dev:email        # History page consumer smoke test
```
