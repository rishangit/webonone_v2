# 01 — Overview (1.10.1)

## Vision

List screens across Email, WebOnOne, and Media expose filters inconsistently — some use inline forms (History), others use tab buttons (Queue), and several have no search at all. Users should get the same affordance on every collection page: a filter icon in the page header that opens a right-side panel, applies criteria, and highlights when filters are active.

## User story

As a user, I want a consistent search and filtering experience on every page that displays a list, so I can efficiently find the content I need.

### Acceptance criteria (from ClickUp)

1. The right navigation panel with filters must be a **reusable component from the UI kit**.
2. It must appear on **every page that displays a list**.
3. When the **search/filter icon** is clicked, the panel **slides open** and the user can apply filters.
4. When filters are applied, **results update** and the **filter icon highlights** to indicate active criteria.
5. This behavior must be **enforced by rules** so all list pages include search and filter functionality.

## Goals (1.10.1)

1. **`ListFilterPanel`** — slide-over panel anchored to the right; accepts arbitrary filter fields as `children`.
2. **`ListFilterTrigger`** — icon button for `FeaturePage` `actions`; shows active state when any filter differs from defaults.
3. **Rollout** — migrate in-scope list pages from inline filter UI to the shared pattern.
4. **Showcase** — Components tab demo with sample filters + `ItemList`.
5. **Agent rule** — `list-filter-panel.mdc` indexed; item-list skill cross-linked.

## Baseline (current state)

| Page | Current filter UX |
|------|-------------------|
| Email History | Inline `<Form>` with status, dates, slug |
| Email Queue | Tab buttons (status segment) |
| Email Templates | None (full list) |
| Email Dashboard recent | None |
| WebOnOne Companies | None |
| WebOnOne System Theme | None |
| Media Library browser | Folder path only |

## Scope (1.10.1)

### In scope

- `ui-kit/package` — `ListFilterPanel`, `ListFilterTrigger` (or combined export pattern).
- `ui-kit/showcase` — demo section on Components tab.
- Service list pages listed in [03-service-filter-rollout.md](./03-service-filter-rollout.md).
- `.cursor/rules/list-filter-panel.mdc` + README index.

### Out of scope (1.10.1)

- Global full-text search across services.
- Backend search API changes unless a page already supports query params (wire existing APIs).
- Identity service (no collection lists).
- Filter persistence in URL query strings (optional follow-up).
- `UserSelectionDialog` filter row (different UX — dialog, not list page).

## Glossary

| Term | Definition |
|------|------------|
| **List page** | `FeaturePage` hosting `ItemList` (or list child) + usually `Pagination` |
| **Filter panel** | Right-side slide-over containing filter controls |
| **Active filters** | Any criterion not equal to its default / “all” value |
| **Filter trigger** | Header icon button that toggles the panel |

## Success criteria

1. `ListFilterPanel` and trigger exported from `@webonone/ui-kit`.
2. Every in-scope list page uses the panel; inline filter forms removed.
3. Clicking the trigger opens/closes the panel with slide animation.
4. Applying filters refreshes data; pagination resets to page 1.
5. Trigger shows visual active state when filters are applied.
6. `list-filter-panel.mdc` exists and is indexed.
7. `npm run type-check` passes for `ui-kit-root`, `email-root`, `webonone-v2-root`, `media-root`.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — list search/filter | 86ey58rda | All docs |
