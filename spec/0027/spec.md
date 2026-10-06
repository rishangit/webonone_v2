# Feedback 0027 — Mobile view scroll bar needs to be aligned more to the right

| Field | Value |
|-------|-------|
| Ticket | `0027` |
| Feedback id | `shqOHusWEeTBtlR2EK9f6` |
| Type | `bug` |
| Title | Mobile view scroll bar needs to be aligned more to the right |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

After feedback 0019 widened mobile feature pages (`shellPagePadding` → `px-0`), list rows and detail cards fill the full `#main-content` / embed `<main>` width. The themed scrollbar (8px) then sits on top of those surfaces. Mobile needs a right-side clearance so the scrollbar sits to the right of cards and item lists without restoring the old left inset.

## Problem / goal

**Problem:** On phone-width viewports, the main/embed scrollbar overlays page cards and item-list rows because content is flush to the scrollport’s right edge.

**Goal:** Keep the 0019 left-edge alignment with the AppHeader bar; add enough mobile right inset (or equivalent scrollbar gutter) so the scrollbar no longer covers list/detail content.

## Acceptance criteria

1. Below `sm`, FeaturePage list and details content no longer sits under the `#main-content` scrollbar — cards and `ItemList` rows clear the thumb.
2. Mobile left edge still matches the AppHeader bar (`pl-0` / no return to `px-2` on both sides).
3. From `sm` up, existing `sm:px-6 sm:py-6` behavior is unchanged.
4. Peer embeds that scroll via `PlatformEmbedShell` `<main>` show the same mobile clearance for FeaturePage content.
5. Support help site mirrored `shellPagePadding` stays in sync if it duplicates the token.
6. Touched workspaces pass type-check and lint (`@webonone/ui-kit`, support frontend as needed).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | Mobile right clearance on `shellPagePadding` and/or scroll-container gutter on AppShell / embed main |
| `packages/platform-embed` | Same gutter on `PlatformEmbedShell` main if scroll-container approach is used |
| `support/frontend` | Mirror duplicate `shellPagePadding` token |
| `.cursor/rules/feature-page-layout.mdc` | Document the asymmetric mobile padding / gutter |
| `spec/0027/` | This package |

## Out of scope

- Redesigning desktop (`sm+`) page padding
- Changing scrollbar thumb width/color tokens
- Per-service list/details page copy or layout refactors
- Support help articles (chrome spacing bug only)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/platform-embed  # if embed shell changed
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: `npm run dev:webonone` → narrow viewport → scroll a list (e.g. Companies) and a details page → scrollbar sits to the right of cards/rows, left edge still flush with header bar.
