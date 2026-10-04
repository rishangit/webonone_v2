# Feedback 0015 — Add media dialog window improvement for mobile UI

| Field | Value |
|-------|-------|
| Ticket | `0015` |
| Feedback id | `3NDCmcNYgHoQxDXcedAic` |
| Type | `bug` |
| Title | Add media dialog window improvement for mobile UI |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The Add Media / Select media dialog body (`ScopedFolderBrowser` with `showIconToolbar`, Media `/selector` embed) must match list-page mobile toolbar UX: compact circular search that expands like `ListPageActions` + `SearchInput`, and other icon controls aligned to the same full-circle size as the mobile list buttons (`h-9 w-9`).

## Problem / goal

On narrow viewports the selector toolbar already has a `SearchInput`, but it stays a full `w-64` field (no `ListPageActions` / compact icon→expand). Upload, create-folder, and view-toggle buttons use `size="icon"` (`h-10 w-10`), so they do not match `ListFilterTrigger` / collapsed list search (`h-9 w-9` full circles under pill radius).

**Goal:** Mobile Add Media toolbar uses the same search control behavior as item list pages, and all toolbar icon buttons share the same circular geometry.

## Acceptance criteria

1. In the Add Media / selector toolbar (`showIconToolbar`), search uses `ListPageActions` + `SearchInput` with the same compact mobile behavior as list pages (icon below `sm`, tap expands left; `onClear` clears the query). Filename/folder filter behavior stays client-side as today.
2. Upload, create-folder, list-view, and thumbnail-view controls are `h-9 w-9 shrink-0` (same hit area as `ListFilterTrigger` / compact list search), so under pill button radius they read as matching full circles.
3. Desktop (`sm+`) still shows the full search field beside the other toolbar icons; breadcrumb left / toolbar right layout is unchanged.
4. Non-icon-toolbar browser row (library without icon toolbar) keeps search + filter; preferably shares the same `ListPageActions` compact search for consistency.
5. Agent rules that say pickers must stay a full search field are updated so the Media selector/library toolbar may use list-page compact search.
6. `npm run type-check` / `npm run lint` pass for the Media frontend workspace.

## Services affected

| Area | Change |
|------|--------|
| `media/frontend` | `ScopedFolderBrowser` toolbar |
| `.cursor/rules` | `list-filter-panel.mdc`, `ui-kit-consumption.mdc` picker/search wording |
| `spec/0015/` | This package |

## Out of scope

- WebOnOne `PlatformMediaDialogHost` chrome / footer
- Legacy `MediaPicker.tsx` / `/picker` path
- Expo native gallery (`DocumentPicker`)
- Changing filter panel MIME options or selection/Done contract
- Support help articles (no how-to currently documents this toolbar layout)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/media-frontend
npm run lint -w @webonone/media-frontend
```

Manual: narrow viewport (~375px) → open company gallery Add images (or Media Library with icon toolbar) → search is circular icon, expands left like Tags; filter/upload/folder/view toggles are same-size circles; typing still filters names.
