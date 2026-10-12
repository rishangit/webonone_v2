# Feedback 0034 — Show items on the WebOnOne home page

| Field | Value |
|-------|-------|
| Ticket | `0034` |
| Feedback id | `yZhrOVDDPQWq_vCJV2c6R` |
| Type | `feature` |
| Title | Show items on the WebOnOne home page |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The public website home (`website` `/`) is a centered search hero (brand, headline, subtitle, then search). Visitors should see nearby catalog items immediately: a card for each close company, with that company’s products, services, and spaces as cards underneath. Search stays, moved to the top, without the marketing lines above it.

## Problem / goal

**Problem:** Home does not list companies, products, services, or spaces. Search is below headline copy, and an empty query returns no catalog rows.

**Goal:** On the public home page, put search at the top, remove the brand/headline/subtitle block, and list nearby sellable items in cards grouped by the closest approved companies (using the visitor’s location). Typed search still opens the existing `/search` results.

## Acceptance criteria

1. **Search at the top** — Home shows the catalog search field and Search action at the top of the page content. Submitting a non-empty query still opens `/search?q=…`.
2. **Hero copy removed** — The home brand line, headline, and subtitle are not shown.
3. **Nearby cards** — After location is known, home lists approved companies that have a map pin and at least one sellable product, service, or space, nearest first. Each company is a card (name, distance, image when present). Under it, that company’s products, services, and spaces are cards (image, name, kind) that open the existing catalog detail route.
4. **Location** — The existing location bar and permission dialog stay. While location is unresolved, home does not dump an unranked global catalog. If location cannot be resolved, home explains that nearby items need a location.
5. **Help** — The public browse-and-search article (en and si) describes home as nearby company and item cards with search at the top.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/` backend | Nearby catalog read: closest approved companies plus their sellable items |
| `website/` backend | Proxy `GET /catalog/nearby` to WebOnOne internal |
| `website/` frontend | Home layout and nearby card groups |
| `support/` | Update public catalog browse article (en + si) |
| `spec/0034/` | This package |

## Out of scope

- Changing `/search` from the list/map results layout
- A new public company profile page
- Ranking by anything other than company distance (no popularity score)
- Signed-in WebOnOne app Dashboard (`webonone-v2` home)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
npm run type-check -w support-root
```
