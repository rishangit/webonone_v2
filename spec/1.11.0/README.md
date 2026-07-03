# WebOnOne Platform — Specification (1.11.0)

Standalone **Data microservice** for platform-wide predefined reference data: tags, units of measure, attributes, products, services, and spaces. Other services consume Data over a versioned public HTTP API with JWT auth — no shared database.

**Spec No:** 1.11.0

Implementation branch: **`spec/1.11.0`**

Production host: **`data.webonone.com`**

## What changed from 1.10.1

| Area | 1.10.1 | 1.11.0 |
|------|--------|--------|
| Reference data | Ad hoc per service or hard-coded | Central **`data/`** microservice with own DB |
| Tags / attributes / catalog | Not centralized | CRUD + search/filter/pagination for six entity types |
| Platform nav | Identity, Media, Email | **Data** entry (redirect handoff) |
| Consumer integration | N/A | JWT-verified read/write API; optional local ID copies via events (future) |

## Projects affected

| Project | Role in 1.11.0 |
|---------|------------------|
| **Data** (`data/`) | New service — FE + BE + migrations; primary scope |
| **Root** (`package.json`) | Register `data/` workspace; `dev:data`, root `dev` |
| **Platform nav** (`packages/platform-nav/`) | Optional: Data leaf in core nav defs |
| **WebOnOne v2** (`webonone-v2/frontend/`) | Core nav Data link; `dataConfig.ts` peer env |
| **UI Kit** (`ui-kit/`) | Reuse `AppShell`, `FeaturePage`, `ItemList`, `Pagination`, `ListFilterPanel` |
| **Theme** (`packages/theme/`) | System theme + accents on Data admin SPA |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-data-scaffold.md](./02-data-scaffold.md) | Service layout, auth, ports, root wiring |
| [03-domain-entities.md](./03-domain-entities.md) | Entity schemas, relationships, status workflow |
| [04-crud-api.md](./04-crud-api.md) | REST routes, validation, search/filter/pagination |
| [05-admin-ui.md](./05-admin-ui.md) | Admin FE routes, list pages, forms |
| [06-platform-integration.md](./06-platform-integration.md) | Nav handoff, consumer contract, deploy |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [08-list-page-layout-refinements.md](./08-list-page-layout-refinements.md) | Pagination bottom pin; search + filter header alignment (delta) |
| [09-ui-kit-loading-empty-states.md](./09-ui-kit-loading-empty-states.md) | `LoadingState`, `ListEmptyState`, service rollout (delta) |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.11.0 Data microservice | 86ey5f6vq | All docs |
| Subtask: pagination position | 86ey5g15b | [08-list-page-layout-refinements.md](./08-list-page-layout-refinements.md); Phase 7 |
| Subtask: search button and the filter button align to right | 86ey5g1t4 | [08-list-page-layout-refinements.md](./08-list-page-layout-refinements.md); Phase 7 |
| Subtask: need to add the loading component | 86ey5g5r1 | [09-ui-kit-loading-empty-states.md](./09-ui-kit-loading-empty-states.md); Phase 8 |
| Subtask: need to have the no result found commpn component | 86ey5g845 | [09-ui-kit-loading-empty-states.md](./09-ui-kit-loading-empty-states.md); Phase 8 |

## Revision history

- **2026-07-04** — `LoadingState` overlay variant for viewport-centered page loads (subtask delta).
- **2026-07-04** — Subtasks loading component + no-results `ListEmptyState` (UI Kit delta).
- **2026-07-04** — Subtasks `pagination position` and `search/filter header alignment` (list page layout delta).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Microservice boundaries, JWT, no shared DB |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | `FeaturePage` for Data admin pages |
| [../1.9.2/04-service-pagination-rollout.md](../1.9.2/04-service-pagination-rollout.md) | Server-side `Pagination` on list APIs |
| [../1.10.1/02-ui-kit-list-filter-panel.md](../1.10.1/02-ui-kit-list-filter-panel.md) | `ListFilterPanel` on collection pages |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Express handlers | `nodejs-express.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Feature pages | `feature-page-layout.mdc` |
| Chunk splitting | `frontend-vite-chunk-splitting.mdc` |

## Local dev

```bash
npm run dev:data          # Data FE :3005 + BE :4005
npm run migrate -w data-root
```
