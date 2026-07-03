# WebOnOne Platform — Specification (1.10.1)

Adds a reusable **list filter panel** to `@webonone/ui-kit` and rolls it out on every service page that displays a filterable collection (`ItemList` + `Pagination`). Users open filters from a header icon; the panel slides in from the right; applied criteria highlight the icon and refresh list results.

**Spec No:** 1.10.1

Implementation branch: **`spec/1.10.1`**

## What changed from 1.10.0

| Area | 1.10.0 | 1.10.1 |
|------|--------|--------|
| List filters | Inline `<Form>` rows per page (e.g. Email History) | Shared right-side `ListFilterPanel` in UI Kit |
| Filter affordance | Ad-hoc “Apply filters” buttons | Header filter icon; active state when criteria set |
| Panel UX | Always visible or page-specific | Slide-over panel opened from icon |
| Agent guidance | `item-list-pagination.mdc` only | + `list-filter-panel.mdc` rule |

## Projects affected

| Project | Role in 1.10.1 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | `ListFilterPanel`, `ListFilterTrigger`; showcase demo |
| **Email** (`email/`) | History, Queue, Templates, Dashboard recent activity |
| **WebOnOne v2** (`webonone-v2/`) | Companies, System Theme lists |
| **Media** (`media/`) | Library folder browser media items |

Identity has no in-scope collection list pages (see [03-service-filter-rollout.md](./03-service-filter-rollout.md)).

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-ui-kit-list-filter-panel.md](./02-ui-kit-list-filter-panel.md) | Component API, slide panel, active indicator |
| [03-service-filter-rollout.md](./03-service-filter-rollout.md) | Cross-service adoption inventory |
| [04-cursor-rules.md](./04-cursor-rules.md) | `.cursor/rules/` documentation |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.10.1 | 86ey58rda | All docs |

## Revision history

- **2026-07-03** — Initial spec from parent user story (search/filter panel on list pages).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | `FeaturePage` + header `actions` for filter trigger |
| [../1.9.2/02-ui-kit-pagination.md](../1.9.2/02-ui-kit-pagination.md) | `Pagination` below list; reset page on filter change |
| [../1.9.2/04-service-pagination-rollout.md](../1.9.2/04-service-pagination-rollout.md) | List page inventory |

## Rules reference

| Topic | Rule |
|-------|------|
| Feature pages | `feature-page-layout.mdc` |
| Item lists | `item-list` skill |
| Pagination | `item-list-pagination.mdc` |
| List filters | `list-filter-panel.mdc` (new in 1.10.1) |

## Local dev

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w email-root
npm run type-check -w webonone-v2-root
npm run type-check -w media-root
```
