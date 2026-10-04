# Feedback 0014 — Improvements to the add button on the mobile view list page

| Field | Value |
|-------|-------|
| Ticket | `0014` |
| Feedback id | `zi7bZZl7eaaA43NCi5HOY` |
| Type | `feature` |
| Title | Improvements to the add button on the mobile view list page |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On mobile list-page toolbars, the primary **Add** control (`ListAddButton`) should start as an icon-only rounded **+** button (matching neighboring compact controls), then expand on first tap to show the full label. Apply the same behavior on the web responsive mobile viewport (`@webonone/ui-kit`) and the native Expo app (`@webonone/mobile-ui`), keeping the existing primary background.

## Problem / goal

Today, compact `ListAddButton` shows **+ Add** (Plus icon plus the short `compactLabel`, default `Add`) until the first tap, then expands to the full children label (e.g. `Add tag`). That intermediate text is noisy next to icon-only search/filter controls.

**Goal:** Collapsed state = **+** only inside a rounded primary button. First tap expands left to the full label (same motion timing as today). Second tap runs the create action. Outside tap / opening search still collapses. Desktop (`sm+` on web) stays Plus + full label with no expand step.

## Acceptance criteria

1. Below `sm` (web) and on native list toolbars using `ListPageActions` / `PageHeader` actions, collapsed `ListAddButton` shows only the Plus icon in a rounded control sized like other toolbar icon buttons — **no** visible “Add” / compact label text.
2. First press expands to Plus + full children label (300ms ease-out, grow left); second press invokes `onClick` / `onPress` and collapses after the action (existing expand/collapse coordination with search unchanged).
3. Primary / default button background (gradient) is unchanged vs current Add CTA.
4. Behavior ships in both `@webonone/ui-kit` `ListAddButton` and `@webonone/mobile-ui` `ListAddButton`; showcase / kit copy that still says “+ Add” is updated to “+ only until tapped”.
5. Docs/rules that prescribe **+ Add** compact copy are updated to icon-only collapsed.
6. `npm run type-check` / `npm run lint` pass for touched UI Kit and mobile-ui workspaces (and mobile app type-check if app call sites need cleanup).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | Compact `ListAddButton` collapsed = icon-only |
| `ui-kit/showcase` | Demo description strings |
| `packages/mobile-ui` | Same compact behavior for native |
| `.cursor/rules` / `.cursor/skills` | **+ Add** → icon-only wording |
| `spec/0014/` | This package |

## Out of scope

- Changing desktop (`sm+`) always-expanded Add label behavior
- Changing filter/search compact interactions beyond shared collapse coordination
- Rewriting every consumer that passes unused `compactLabel` (prop may remain for API compat / be ignored when collapsed)
- Support help articles (no product docs currently document the compact Add label)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
```

Manual: narrow viewport or native list (e.g. Tags) → Add is **+** only → first tap expands to full label → second tap opens create; filter/search still collapse Add.
