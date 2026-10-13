# Feedback 0038 — Increase the width of the web mobile item details page

| Field | Value |
|-------|-------|
| Ticket | `0038` |
| Feedback id | `AZz6-PeZo1XImCs2DCwsp` |
| Type | `feature` |
| Title | Increase the width of the web mobile item details page |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The public website catalog item page (`/catalog/:kind/:id`) insets its content with `px-4` below `sm`. The home page and the Expo product screens do not add that extra gutter. On a phone the detail cards sit in a narrower column than the rest of the mobile product UI.

## Problem / goal

**Problem:** Catalog detail wraps the location bar and `FeaturePage` in `px-4` (and `sm:px-8`). The website shell already insets the app with `p-2`. Stacking `px-4` on a phone shrinks the item details below the home column and below the app’s `FeatureScreen` content width (`px-2`).

**Goal:** On viewports below `sm`, the item details page uses the maximum width of `#main-content` (no extra horizontal padding). From `sm` up, keep the existing `sm:px-8` gutter. Add a project skill that records this mobile-width rule so later web mobile UI can match the app.

## Acceptance criteria

1. **Full mobile width** — Below `sm`, the catalog item details location bar and page body have no extra horizontal padding (`px-0`). Content fills the shell content area.
2. **Desktop gutter unchanged** — From `sm` up, the same regions keep `sm:px-8`. `max-w-[100rem]` on the column stays.
3. **Home page unchanged** — Homepage search, nearby cards, and search results keep their current gutters.
4. **Mobile view skill** — `.cursor/skills/web-mobile-view/SKILL.md` states that phone-width web item details use maximum content width and points at the website catalog detail page and the Expo `FeatureScreen` inset. The skill is listed under cross-cutting skills in `AGENTS.md`.

## Services affected

| Area | Change |
|------|--------|
| `website/` frontend | Catalog item details mobile gutter |
| `.cursor/skills/web-mobile-view/` | New skill |
| `AGENTS.md` | Skill index row |
| `spec/0038/` | This package |

## Out of scope

- Homepage, search results, and other website routes
- Expo `FeatureScreen` padding
- UI Kit `shellPagePadding` defaults
- Support articles (visual width only; no new screen, nav, or workflow)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```
