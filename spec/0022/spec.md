# Feedback 0022 — Add product from library dialog mobile UI

| Field | Value |
|-------|-------|
| Ticket | `0022` |
| Feedback id | `zgseKdhZ5IXLGsRrCVrs6` |
| Type | `bug` |
| Title | Add product from library dialog mobile UI should align with mobile view |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the Expo app, **Data → Products → Add → Add from library**, the library picker still shows a full-width search field and a labeled outline **Add product to library** button. Mobile list pages (and other pickers fixed in feedback 0017) already use compact `ListPageActions` + `SearchInput` + `ListAddButton` (search icon / `+` until expanded). The library dialog must match that toolbar.

## Problem / goal

**Problem:** `mobile/.../LibraryPickerPanel.tsx` uses a wrapped full `SearchInput` plus an outline `Button` with `Plus` and the full label. That diverges from the mobile-ui list-page toolbar used on Tags, company catalog lists, POS customer picker, etc.

**Goal:** The Add-from-library dialog toolbar (search + Add … to library) uses the same compact list-page mobile UI as `@webonone/mobile-ui` list screens.

WebOnOne web `LibraryPickerPanel` already wraps `ListPageActions` (feedback 0017) — out of scope unless a regression is found.

## Acceptance criteria

1. Native **Add products from library** dialog toolbar uses `ListPageActions` wrapping `SearchInput` then `ListAddButton` (label still “Add product to library” / i18n `library.addToLibrary`).
2. Search starts as compact icon control; Add starts as `+` until expanded — same behavior as company catalog / Tags list screens.
3. Same panel is reused for services/spaces library pick when those kinds expose create-in-library — one fix covers all `LibraryPickerPanel` consumers.
4. Desktop-style full search + labeled Add is not required on native (native always uses the compact list toolbar).
5. Touched workspaces pass `npm run type-check -w @webonone/mobile` (and mobile-ui if kit changes).

## Services affected

| Area | Change |
|------|--------|
| `mobile/` | `LibraryPickerPanel` toolbar → list-page compact pattern |
| `packages/mobile-ui/` | Only if a primitive gap is discovered (prefer reuse) |
| `spec/0022/` | This package |

## Out of scope

- Web `webonone-v2` `LibraryPickerPanel` (already `ListPageActions` per 0017)
- Data `CatalogLibrarySelectEmbedPage` (search-only peer body; no Add-to-library control)
- Changing library create / peer-dialog create flow
- Support help (bugfix, no usage change beyond layout parity)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/mobile
npm run type-check -w @webonone/mobile-ui
```

Manual: `npm run mobile` → Data → Products → Add → Add from library — toolbar matches list-page search / `+` expand.
