# WebOnOne Platform — Specification (1.11.4)

Improve the **UI Kit showcase** with reusable **page-level** demos. Add a top-level **Pages** tab with nested **List page** and **Details page** demos that compose existing `@webonone/ui-kit` primitives (FeaturePage, ListPageBody, ItemList, Pagination, forms) the way production services do.

**Spec No:** 1.11.4

Implementation branch: **`spec/1.11.4`**

## What changed from 1.11.2

| Area | 1.11.2 | 1.11.4 |
|------|--------|--------|
| Focus | Data ↔ Email cross-satellite nav + loading overlay | UI Kit showcase **Pages** tab |
| Showcase tabs | Controls, Components, Dialogs, Icons, Tags | + **Pages** (List / Details nested tabs) |
| List demos | Fragmented under Components (ItemList, Pagination, filters separately) | One composed **list page** with all list building blocks |
| Details demos | No page-level details demo | Composed **details page** with FeaturePage + form controls |

## Projects affected

| Project | Role in 1.11.4 |
|---------|----------------|
| **UI Kit showcase** (`ui-kit/showcase/`) | New Pages tab + List / Details nested demos |
| **UI Kit package** (`ui-kit/package/`) | No new components required unless a gap is found while composing demos — prefer reuse |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-pages-tab-showcase.md](./02-pages-tab-showcase.md) | Pages tab, nested List/Details demos, composition checklist |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.11.4 Ui-Kit improvement | 86ey9pkp2 | `01-overview.md`, `README.md` |
| Subtask: Need to have the pages tab in the UI kits show case | 86ey9pkzn | [02-pages-tab-showcase.md](./02-pages-tab-showcase.md); Phase 1 |

## Revision history

- **2026-07-14** — Initial spec from ready inventory (parent + Pages tab subtask).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.2/02-ui-kit-pagination.md](../1.9.2/02-ui-kit-pagination.md) | `Pagination` API |
| [../1.9.2/03-showcase-components-pagination.md](../1.9.2/03-showcase-components-pagination.md) | Showcase Components tab list primitives |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | `FeaturePage` layout |
| [../1.9.1/04-ui-kit-otp-input.md](../1.9.1/04-ui-kit-otp-input.md) | UI Kit component + showcase registration pattern |

## Rules reference

| Topic | Rule / skill |
|-------|----------------|
| UI Kit scope | `ui-kit-project.mdc` |
| Consumer usage | `ui-kit-consumption.mdc` |
| Feature page | `feature-page-layout.mdc` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| List + pagination | `item-list-pagination.mdc` |
| List filters | `list-filter-panel.mdc` |
| Form composition | `.cursor/skills/form-creation/SKILL.md` |

## Local dev

```bash
npm run dev:ui-kit   # Showcase — http://localhost:3012 — Pages tab
```
