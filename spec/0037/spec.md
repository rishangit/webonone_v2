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

The public website home page shows nearby catalog cards (and the same card for search results). On a phone the cards sit too far apart, draw a divider above the company row, wrap tags onto extra lines, and show a reference count next to the item name.

## Problem / goal

**Problem:**

1. Homepage grids use a 12px gap (`gap-3`) even in the two-column phone layout.
2. The company block on `CatalogPublicItemCard` is separated by `border-t`.
3. Tags wrap (`flex-wrap`) and only the first three show, with a `+N` remainder. On a phone that uses a second line instead of one swipeable row.
4. Each card prints `Refs: {count}` beside the name. That count should not appear on website cards, including phone-width layouts.

**Goal:** Tighten the homepage card gap on small screens, drop the company divider, keep tags on one horizontally swipeable row below `md`, and remove the reference label from the card.

## Acceptance criteria

1. **Tighter mobile card gap** — Nearby home cards and home search-result cards use `gap-2` below `md` and `gap-3` from `md` up. Column counts stay as they are (nearby: two columns below `md`).
2. **No company divider** — The line above the company name/logo on the homepage card is gone. The company row still sits at the bottom of the card.
3. **One swipeable tag row on mobile** — Below `md`, tags render in a single non-wrapping row. Extra tags stay on that row and scroll horizontally (swipe). From `md` up, the card still shows the first three tags plus a `+N` remainder when there are more.
4. **No reference count on the card** — `Refs: {count}` is not rendered on the catalog card used by the home page and search results, at any viewport width.

## Services affected

| Area | Change |
|------|--------|
| `website/` frontend | Homepage grids and `CatalogPublicItemCard` |
| `spec/0037/` | This package |

## Out of scope

- UI Kit `itemListCardGridClassName` default (other services share it)
- Catalog detail pages (they do not use this card)
- Support articles (visual card tweaks; no new screen, nav, or workflow)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```
