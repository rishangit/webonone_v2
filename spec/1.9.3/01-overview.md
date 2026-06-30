# 01 — Overview (1.9.3)

## Vision

Admin and settings flows across WebOnOne, Email, and future services need to pick a user from a large directory without bespoke modals per screen. A single UI Kit **`UserSelectionDialog`** wraps the platform **`CustomDialog`** pattern, loads users on scroll, supports name search and role filtering, and returns the selected user to the caller on row click.

## User story

As a developer building admin features, I want a reusable user selection dialog, so that I can consistently search, filter, and pick users across services without reimplementing modal, scroll, and filter logic.

## Goals (1.9.3)

1. **`UserSelectionDialog` component** — controlled `open` / `onOpenChange`; `onSelect(user)` closes dialog and returns selection.
2. **`CustomDialog` shell** — scrollable body (`sizeHeight="large"`, internal scroll); standard header + footer (Cancel only; selection is row click).
3. **Infinite scroll** — injectable `loadUsers`; append pages as user scrolls near list bottom; loading spinner at sentinel.
4. **Search** — debounced text field filtering by display name and email (passed to `loadUsers`).
5. **Role filter** — optional `roleOptions` + `Select`; `all` clears role filter.
6. **Selectable list** — `ItemList` rows; primary click selects user; active row highlight via `itemListRowActiveClassName`.
7. **Empty / error states** — `ItemListEmpty`, inline error alert, retry on failed fetch.
8. **Showcase demo** — Dialogs tab with mock `loadUsers` (100+ fake users).
9. **Reference consumer** — WebOnOne settings demo or company flow wires real or stub API via same callback contract.

## Scope (1.9.3)

### In scope

- `ui-kit/package/src/components/UserSelectionDialog.tsx` + types + export.
- Infinite-scroll hook or internal sentinel (`IntersectionObserver`).
- Showcase demo on **Dialogs** tab (`DialogsPage.tsx` or equivalent).
- WebOnOne reference page or dialog trigger demonstrating integration.
- Agent guidance cross-link in `item-list` skill (selectable row variant).

### Out of scope (1.9.3)

- Identity user-search REST API (consumers pass their own `loadUsers`; Identity API is a follow-up if needed).
- Multi-select users (single select only).
- Embedding Identity UI in iframe for user pick.
- Migrating every screen that might pick users — one reference consumer only.
- URL sync or persisting last search in localStorage.

## Glossary

| Term | Definition |
|------|------------|
| **User option** | `{ id, displayName, email, role?: string, avatarUrl?: string }` returned to consumer |
| **Load page** | One batch from `loadUsers({ search, role, page, pageSize })` |
| **Infinite scroll** | Append next page when scroll sentinel enters viewport; stop when `hasMore === false` |
| **Calling service** | Any microservice frontend that opens the dialog and handles `onSelect` |

## Success criteria

1. `UserSelectionDialog` exported from `@webonone/ui-kit` with documented props and types.
2. Dialog uses `CustomDialog`; body scrolls; list loads more users on scroll.
3. Search and role filter reset list to page 1 and refetch.
4. Selecting a row calls `onSelect(user)` and closes dialog (`onOpenChange(false)`).
5. Showcase Dialogs tab demonstrates full flow with mock data.
6. WebOnOne reference consumer opens dialog and logs or displays selected user.
7. `npm run type-check -w ui-kit-root` and `webonone-v2-root` pass.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|----------------|
| Parent — user selection dialog | 86ey40acd | All |

### Acceptance criteria (from ClickUp parent)

1. Scrollable modal using existing common dialog pattern (`CustomDialog`).
2. Users loaded dynamically on scroll (infinite scroll).
3. Search bar and filtering by user name and role.
4. On select — dialog closes; selected user details returned to calling service.
5. Reusable across multiple services (WebOnOne, Email, etc.) via injectable `loadUsers`.
