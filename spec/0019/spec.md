# Feedback 0019 — Mobile view body area needs increased width

| Field | Value |
|-------|-------|
| Ticket | `0019` |
| Feedback id | `WxY6R1Xuqj6D22JAl5ndq` |
| Type | `bug` |
| Title | Mobile view body area needs increased width |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On narrow (mobile) web viewports, AppShell feature pages apply an extra horizontal inset on top of the shell chrome padding. List rows and details content therefore sit narrower than the AppHeader glass bar. Users expect the body content width to match the header bar width.

## Problem / goal

**Problem:** Mobile list pages and details pages look inset relative to the header: shell chrome uses `p-2`, and `FeaturePage` adds another `px-2`, so body content is ~16px narrower than the header bar.

**Goal:** On mobile, page body (list items, details cards) should span the same horizontal width as the AppHeader bar. Desktop (`sm+`) spacing stays unchanged.

## Acceptance criteria

1. Below `sm`, `FeaturePage` content has **no extra horizontal padding** beyond AppShell chrome (`p-2`), so list/details width matches the header bar.
2. From `sm` up, horizontal page padding remains `sm:px-6` (aligned with header inner row).
3. Vertical page padding (`py-4` / `sm:py-6`) is unchanged.
4. Dialog overlay inset stays aligned with the header bar (`shellDialogOverlayClassName` unchanged).
5. Iframe / full-bleed embed routes remain free of AppShell main padding (padding stays on `FeaturePage`, not `#main-content`).
6. Support help site page padding mirrors the same mobile token if it duplicates `shellPagePadding`.
7. Touched workspaces pass type-check and lint (`@webonone/ui-kit`, support frontend if changed).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | `shellPagePadding` mobile horizontal token |
| `support/frontend` | Mirror duplicate `shellPagePadding` if present |
| `.cursor/rules` | Clarify FeaturePage owns page padding (optional, if stale) |
| `spec/0019/` | This package |

## Out of scope

- Native Expo / `@webonone/mobile-ui` FeatureScreen padding (separate stack; not named in the report)
- Changing shell chrome `p-2` or AppHeader inner `px-2`
- Per-page padding overrides in webonone-v2 / peer services
- Redesigning ItemList, Card, or details grid
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: `npm run dev:webonone` → narrow viewport → open a list page and a details page → content glass/cards align with the header bar left/right edges (not inset further). Widen past `sm` → page still has `sm:px-6` inset matching header controls.
