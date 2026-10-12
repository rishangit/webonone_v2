# Feedback 0035 — WebOnOne web home page UI on mobile

| Field | Value |
|-------|-------|
| Ticket | `0035` |
| Feedback id | `ZTWqVok5dfH_de4MrpLgo` |
| Type | `feature` |
| Title | Webonone web home page ui improvements in mobile |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The public website home (`website` `/`) shows search, the location bar, and nearby catalog item cards. On a phone the content column is inset inside the header bar, and nearby cards stack one per row. Home content should span the same width as the header bar, and nearby cards should show two per row on small screens.

## Problem / goal

**Problem:** Home page content is narrower than the header because the page adds horizontal padding (`px-4` / `sm:px-8`) inside the shell. Nearby item cards use a single column until the `md` breakpoint.

**Goal:** On the public home page, align the content column with the header bar width, and show two nearby item cards in each row on mobile.

## Acceptance criteria

1. **Header-aligned width** — Home search, location bar, and nearby item area use the full width of the header bar (no extra horizontal inset beyond the shell).
2. **Two cards per row on mobile** — Nearby catalog item cards render two columns from the smallest viewport through `sm`. From `md` upward the existing column counts stay (`md` 2, `lg` 3, `xl` 4, `2xl` 5).
3. **Search mode unchanged in columns** — Typed search results keep the shared card-grid column counts. This ticket only changes the home nearby grid.
4. **Help** — The public browse-and-search article (en and si) notes that on a phone, nearby items fill the header width and show two cards per row.

## Services affected

| Area | Change |
|------|--------|
| `website/` frontend | Home page horizontal padding; nearby card grid columns |
| `support/` | Update public catalog browse article (en + si) |
| `spec/0035/` | This package |

## Out of scope

- WebOnOne app Dashboard (`webonone-v2` `/`)
- Changing search-results column counts
- Desktop column counts from `md` upward
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
npm run type-check -w support-root
```
