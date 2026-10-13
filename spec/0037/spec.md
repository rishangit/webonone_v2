# Feedback 0037 — Improve the UI web homepage

| Field | Value |
|-------|-------|
| Ticket | `0037` |
| Feedback id | `UgJFYHagK0Ygo03E11ejp` |
| Type | `feature` |
| Title | Improve the ui web homepage |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The public website home page shows nearby catalog item cards (and search results) in a card grid. On a phone the nearby section is two columns with the shared card-grid gap (`gap-3`, 12px). That space between cards is larger than the homepage needs in mobile view.

## Problem / goal

**Problem:** `CatalogPublicItemCardGrid` uses UI Kit `ItemListCardGrid`, whose default gap is `gap-3` at every breakpoint. The home nearby grid forces two columns below `md`, so that 12px gap shows both between columns and between rows and reads as too much space on a phone.

**Goal:** On viewports below `md`, reduce the gap between homepage item cards. From `md` up, keep the existing `gap-3`.

## Acceptance criteria

1. **Tighter mobile card gap** — On the home page, nearby item cards use `gap-2` (8px) below the `md` breakpoint, including the two-column phone layout.
2. **Search results on the same page** — Catalog search results rendered on the home page use the same mobile gap.
3. **Desktop unchanged** — From `md` up, the card grid gap stays `gap-3`. Column counts stay as they are today (two columns below `md` for nearby; the kit column ramp from `md` up).
4. **No other surfaces** — Catalog detail and admin shells are unchanged. Card internals (image, price, company row) are unchanged.

## Services affected

| Area | Change |
|------|--------|
| `website/` frontend | Homepage card grids pass a smaller gap below `md` |
| `spec/0037/` | This package |

## Out of scope

- Changing UI Kit `itemListCardGridClassName` (other services share that default)
- Card content, images, or two-column layout itself
- Catalog detail page spacing
- Support articles (spacing only; no new screen, nav, or workflow)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```
