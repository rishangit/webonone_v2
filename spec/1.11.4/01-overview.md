# 01 — Overview (1.11.4)

## Vision

Developers using `@webonone/ui-kit` need a showcase place that mirrors **real admin pages**, not only isolated control demos. Today Components shows ItemList, filters, and Pagination as separate sections. Production screens compose those into a **list page** (`FeaturePage` → filters → `ListPageBody` → `ItemList` + `Pagination`) and a **details / editor page** (`FeaturePage` + form fields).

1.11.4 adds a **Pages** top-level tab with nested **List page** and **Details page** demos so the showcase documents the full reusable page patterns in one place.

## User story

As a developer browsing the UI Kit showcase, I want a **Pages** tab with **List page** and **Details page** examples that show every relevant kit building block together, so I can copy the same composition into Identity, WebOnOne, Media, Email, and Data.

## Goals (1.11.4)

1. **Pages tab** — new top-level showcase tab alongside Controls, Components, Dialogs, Icons, Tags.
2. **Nested page type tabs** — under Pages: **List page** and **Details page**.
3. **List page demo** — common list page composition with **all practical list building blocks** (see [02-pages-tab-showcase.md](./02-pages-tab-showcase.md)).
4. **Details page demo** — common details/editor page with **all practical form / layout building blocks** used on service detail screens.
5. **Reuse over invent** — prefer existing package exports; no new business domain types in showcase.
6. **Deep-linkable** — Pages tab (and ideally nested List/Details) reachable via hash, consistent with existing showcase nav.

## Scope (1.11.4)

### In scope

- `ui-kit/showcase`: `showcase-nav.ts`, `ShowcaseApp.tsx`, new `PagesPage` (and optional `ListPageDemo` / `DetailsPageDemo` modules)
- Nested tabs (or equivalent UX) for List vs Details under Pages
- Mock/static sample data only (no service APIs)
- Docs/demo copy that names the kit exports used

### Out of scope

- New `@webonone/ui-kit` components unless a hard gap blocks a demo (document and justify if required)
- Migrating production service pages
- Changing Components tab demos (may later thin duplicates; not required)
- AppShell / AuthLayout / platform handoff pages (remain Layout demos under Components if already present)
- Backend, Identity JWT, or consumer env changes

## Glossary

| Term | Definition |
|------|------------|
| **Showcase tab** | Top-level Radix Tabs value synced to URL hash (`#pages`, `#controls`, …) |
| **List page** | Feature route that lists entities: `FeaturePage` + list chrome + `ListPageBody` |
| **Details page** | Feature route that views/edits one entity: `FeaturePage` + form fields / actions |
| **Composition demo** | Showcase section that wires multiple kit primitives the way a consumer page does |

## Success criteria

1. Showcase hash `#pages` opens the Pages tab.
2. Under Pages, user can switch between List page and Details page demos.
3. List demo includes FeaturePage chrome, search/filter actions, ItemList (menu + empty + active row), ListPageBody, and Pagination with default page size 12 / options `[12, 24, 48]`.
4. Details demo includes FeaturePage chrome and a representative set of form controls / actions used on service editors.
5. No regression: existing showcase tabs still work; `npm run type-check -w ui-kit-root` and `npm run build -w @webonone/ui-kit` pass.
6. Demo uses `@webonone/ui-kit` imports only (plus local showcase wrappers like `DemoSection` if needed).

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Ui-Kit improvement | 86ey9pkp2 | All docs |
| Subtask — Pages tab | 86ey9pkzn | [02-pages-tab-showcase.md](./02-pages-tab-showcase.md) |

### Source requirements (from ClickUp)

**Parent:** Improve the UI Kit showcase with reusable items.

**Subtask 86ey9pkzn:**

> Under the Pages tab need another tabs: list page, details page.
> In list page need to show the common list page with all the possible items.
> In detail page also need to show all the possible items.
