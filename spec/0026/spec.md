# Feedback 0026 — Issue in item list page mobile view

| Field | Value |
|-------|-------|
| Ticket | `0026` |
| Feedback id | `rIOMTknVNhH17MIo79z-Q` |
| Type | `bug` |
| Title | Issue in item list page mobile view |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On mobile-width list pages (web below `sm`) and on native mobile, the compact toolbar toggles **Add** and **Search**. When **Add** is already expanded to its full label, tapping **Search** should collapse Add and expand the search field. Today Search only collapses Add and never expands.

## Problem / goal

**Problem:** With Add expanded, a Search tap runs the outside/`pointerdown` dismiss path first. That collapses Add and shifts the Search control under the pointer before the Search click/`onPress` runs, so Search never opens.

**Goal:** Tapping Search while Add is expanded always expands the search field and collapses Add — identical on web mobile list toolbars and native `@webonone/mobile-ui` list toolbars.

## Acceptance criteria

1. Below `sm` on web: expand Add, then tap Search → Add collapses and the search text field expands (same motion as opening Search when Add was collapsed).
2. Same sequence works for every list page that uses `PageHeader` / `ListPageActions` + `SearchInput` + `ListAddButton` (FeaturePage collections and standalone `ListPageActions` toolbars).
3. Native (`@webonone/mobile-ui`): same mutual exclusivity — Search expands and Add collapses when Search is pressed while Add is expanded.
4. Opening Search still collapses Add; tapping outside still collapses Add and closes Search; Escape still collapses both.
5. Tapping Add while Search is open still closes Search and expands Add (existing behavior preserved).
6. Touched workspaces pass type-check and lint (`@webonone/ui-kit`, `@webonone/mobile-ui` as needed).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | `PageHeader` + `ListPageActions` outside-press timing so Search click is not lost |
| `packages/mobile-ui` | List toolbar inside-press / Search touch handling so outside dismiss does not cancel Search open |
| `spec/0026/` | This package |

## Out of scope

- Redesigning compact search/add animation or desktop (`sm+`) layout
- Per-service list page copy changes
- Support help articles (no new user-facing feature; bugfix in existing chrome)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
```

Manual (web): narrow viewport → any Data/Email/WebOnOne list with Search + Add → expand Add → tap Search → field expands. Manual (native): same on Expo list screen.
