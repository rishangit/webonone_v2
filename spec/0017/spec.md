# Feedback 0017 — Add User dialog window mobile UI improvements

| Field | Value |
|-------|-------|
| Ticket | `0017` |
| Feedback id | `bbSkAeT7448uXu9468VmW` |
| Type | `feature` |
| Title | Add User dialog window mobile UI improvements |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On narrow viewports (web phone width and the Expo app), selection dialogs that combine a searchable list with an Add action still use a stacked full-width search field and a full outline Add button (or put Add in the dialog footer). List pages already use compact `ListPageActions` + `SearchInput` + `ListAddButton` (icon search / `+` until expanded). Dialogs should match that list-page toolbar.

## Problem / goal

**Problem:** Add User and POS Add Customer (and other list+search+Add pickers) look and behave differently from mobile list pages: search is always expanded; Add is a full button or footer action.

**Goal:** Every dialog body that shows a searchable item list plus an Add control uses the same compact toolbar as mobile list pages — on web (below `sm`) and on native mobile.

## Acceptance criteria

1. **Web — Add User:** Identity `UserSelectionDialog` toolbar wraps `SearchInput` + `ListAddButton` in `ListPageActions`. Below `sm`, search is icon-expand and Add is `+` until expanded (same motion as Users / Tags list pages). Desktop (`sm+`) keeps full search + labeled Add.
2. **Web — POS Select customer:** Uses the same `UserSelectionDialog` toolbar (no separate POS-only chrome).
3. **Web — Other list+search+Add pickers:** Tag / Unit / Attribute picker panels and company `LibraryPickerPanel` use the same `ListPageActions` + `ListAddButton` pattern (labels unchanged: Add new tag / unit / attribute / Add … to library).
4. **Native — POS customer picker:** `CustomerPickerDialog` puts Add in the toolbar via `ListPageActions` + `SearchInput` + `ListAddButton`; footer no longer has “New customer” (Cancel only unless other footer actions remain).
5. **Native — Add User / user picker:** `UserSelectionDialog` in `@webonone/mobile-ui` supports optional `onAddUser` with the same toolbar; `AddCompanyUserDialog` wires Add so create is reachable from the picker toolbar (aligned with web), not only a separate footer “Register new” path that bypasses list chrome.
6. Optional role filter (web user picker) remains available and does not break compact toolbar layout.
7. Touched workspaces pass type-check and lint; Support how-to notes the mobile toolbar parity where Add User / POS customer pickers are documented.

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/` | `UserSelectionDialog` compact toolbar |
| `data/` | Tag / Unit / Attribute picker panels |
| `webonone-v2/` | `LibraryPickerPanel` toolbar |
| `packages/mobile-ui/` | `UserSelectionDialog` + Add support |
| `mobile/` | `CustomerPickerDialog`, `AddCompanyUserDialog` |
| `support/` | Short help update for mobile picker chrome |
| `spec/0017/` | This package |

## Out of scope

- Search-only pickers with no Add (e.g. service picker) — no requirement to compact unless they already have Add
- Changing picker selection / Done / peer-dialog contracts
- Redesigning create-user / new-customer form dialogs
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w data-root
npm run lint -w @webonone/data-frontend
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

Manual: narrow browser (&lt;640px) — Add User / POS Select customer / Tag picker show icon search + `+` Add; Expo — Users Add and POS customer picker match list-page toolbar.
