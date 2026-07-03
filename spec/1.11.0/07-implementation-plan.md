# 07 — Implementation Plan

Phased delivery for **1.11.0** on branch **`spec/1.11.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.11.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.11.0` |
| Scope | `data/` (new), root `package.json`, `webonone-v2/frontend` nav, `packages/platform-nav` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.11.0/*` documentation
- [ ] Branch `spec/1.11.0`

---

## Phase 1 — Service scaffold

**Goal:** Runnable `data/` with health, auth shell, migrations stub ([02-data-scaffold.md](./02-data-scaffold.md)).

| Task | Detail |
|------|--------|
| Folder layout | `data/package.json`, FE/BE workspaces |
| Backend | Express, `/health`, env, knex, JWT middleware |
| Frontend | Vite, theme, AppShell, login/callback, empty router |
| Root wiring | `dev:data`, workspaces, build chain |
| Migrations | Base tables migration (tags, units, attributes, products, services, spaces, user_roles) |

**Exit criteria:** `npm run dev:data` starts; `GET /health` 200; migrations run.

---

## Phase 2 — Domain API

**Goal:** Full CRUD + list APIs ([03-domain-entities.md](./03-domain-entities.md), [04-crud-api.md](./04-crud-api.md)).

| Task | Detail |
|------|--------|
| Junction migration | Product/service/space tags and attributes |
| Zod schemas | Per entity create/update/list |
| Routes + services | Six resource groups; transactions on nested writes |
| Role middleware | `requireSuperAdmin` on mutating routes |

**Exit criteria:** Manual API test for each entity; list returns pagination envelope.

---

## Phase 3 — Admin UI lists

**Goal:** Six list pages with search, filter, pagination ([05-admin-ui.md](./05-admin-ui.md)).

| Task | Detail |
|------|--------|
| `dataApi` client | RTK Query or fetch wrapper |
| List pages | Tags, Units, Attributes, Products, Services, Spaces |
| ItemList rows | Status badges, overflow menu |
| ListFilterPanel | Status + entity filters |

**Exit criteria:** Navigate all lists; pagination and search work against live API.

---

## Phase 4 — Admin UI editors

**Goal:** Create/edit/delete for all entities.

| Task | Detail |
|------|--------|
| Editor forms | Zod + FormField per entity |
| Tag/color, UOM base unit, attribute type | Conditional fields |
| Product/Service/Space | Tags multi-select, attributes repeater |
| Dashboard | Count cards |

**Exit criteria:** Full CRUD smoke through UI for all six types.

---

## Phase 5 — Platform integration

**Goal:** WebOnOne nav + deploy docs ([06-platform-integration.md](./06-platform-integration.md)).

| Task | Detail |
|------|--------|
| `platform-nav` | Data core nav entry |
| `dataConfig.ts` | WebOnOne peer config |
| `deploy/` | IIS stub for data.webonone.com |
| Chunk splitting | Lazy routes + manualChunks |

**Exit criteria:** WebOnOne Data link opens Data app; build succeeds.

---

## Phase 6 — Documentation

| Task | Detail |
|------|--------|
| `AGENTS.md` | Data service row |
| `.cursor/agents/data-agent.md` | Optional agent stub |
| `.cursor/skills/data-agent/SKILL.md` | Optional skill stub |

**Exit criteria:** Agent map lists Data service.

---

## Phase 7 — List page layout refinements (delta)

**Goal:** Fix Data list UX per [08-list-page-layout-refinements.md](./08-list-page-layout-refinements.md).

| Task | Detail |
|------|--------|
| Header actions | Move `ListSearchField` into `FeaturePage` `actions` with `ListFilterTrigger`; `justify-end` |
| Pagination pin | `ListPageBody` + `flex-1` list wrapper + `Pagination className="mt-auto"` |
| Cursor rules | Update `item-list-pagination.mdc`, `list-filter-panel.mdc` |
| Item-list skill | Checklist bullets for header search and bottom pagination |

**Exit criteria:** Data list pages match acceptance in doc 08.

Spec: subtasks **86ey5g15b**, **86ey5g1t4**

---

## Phase 8 — UI Kit loading and empty states (delta)

**Goal:** [09-ui-kit-loading-empty-states.md](./09-ui-kit-loading-empty-states.md).

| Task | Detail |
|------|--------|
| `LoadingState` | `ui-kit/package/src/components/LoadingState.tsx` |
| `ItemListEmpty` | `ui-kit/package/src/components/ItemList.tsx` |
| Showcase | Demo both components |
| Service rollout | Data, Email, WebOnOne, Media, Identity loading + empty lists |
| Cursor rule | `.cursor/rules/loading-empty-states.mdc` |

**Exit criteria:** Acceptance checklist in doc 09.

Spec: subtasks **86ey5g5r1**, **86ey5g845**

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.11.0 Data microservice | 86ey5f6vq | Phases 1–6 |
| Subtask: pagination position | 86ey5g15b | Phase 7 |
| Subtask: search button and the filter button align to right | 86ey5g1t4 | Phase 7 |
| Subtask: need to add the loading component | 86ey5g5r1 | Phase 8 |
| Subtask: need to have the no result found commpn component | 86ey5g845 | Phase 8 |

---

## Acceptance checklist

- [ ] `npm run dev:data` — FE :3005, BE :4005, standalone `/health`
- [ ] Migrations applied; all six tables + junctions exist
- [ ] CRUD API complete with search, filter, pagination
- [ ] Admin UI: six list pages + six editor flows
- [ ] Identity login + JWT on Data API
- [ ] WebOnOne Data nav handoff works
- [ ] `npm run build -w data-root` — no >500 kB chunk warning
- [ ] `npm run type-check -w data-root` passes
- [ ] `data/deploy/IIS.md` documents data.webonone.com
- [ ] Root `npm run dev` includes Data
- [ ] Data list pages: search + filter in header actions (right-aligned)
- [ ] Data list pages: pagination pinned to bottom via `ListPageBody` + `mt-auto`
- [ ] `LoadingState` + `ItemListEmpty` in UI Kit; rolled out to all services

---

## Final verification commands

```bash
npm run migrate -w data-root
npm run dev:data
npm run build -w data-root
npm run type-check -w data-root
```

Manual: login → create tag → create product with tags/attributes → filter list → delete.
