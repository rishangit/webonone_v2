# Development summary — Feedback 0034

| Field | Value |
|-------|-------|
| Ticket | `0034` |
| Feedback id | `yZhrOVDDPQWq_vCJV2c6R` |
| Title | Show items on the WebOnOne home page |
| Type | `feature` |
| Completed | 2026-10-12 |

## What was delivered

The public website home page no longer shows the brand, headline, or subtitle. Search sits at the top and still opens `/search` for a typed query. Below it, the closest approved companies that have a map pin and at least one sellable item appear as cards, with that company’s products, services, and spaces as cards that open the existing catalog detail page. The public browse-and-search help article matches this layout.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging website | `https://staging.webonone.com/` (home) |
| Search (unchanged list) | `https://staging.webonone.com/search?q=…` |
| Support | `/docs/public-catalog/browse-search` |
| Local | `npm run dev:website` and `npm run dev:webonone` — open the website home (`http://127.0.0.1:3018/`) |

## Feature details

- Nearby listing uses the visitor location already collected on the site (GPS when allowed, otherwise approximate IP location).
- Up to 8 companies, nearest first, and up to 12 items per company (products, services, spaces).
- Companies without coordinates, or with no sellable items, are omitted.
- Text search is unchanged and still requires a query.
- If location cannot be resolved, home asks for location and does not list an unranked catalog.

## Code and docs touched

| Service | Paths |
|---------|--------|
| `webonone-v2/` | `backend/src/services/publicCatalogSearch.service.ts`, `repositories/publicCatalogSearch.repository.ts`, `controllers/publicCatalogSearch.controller.ts`, `routes/publicCatalogSearch.routes.ts` |
| `website/` | `backend` catalog nearby proxy; `frontend` `WebsiteHomePage.tsx`, `NearbyHomeSection.tsx`, catalog API/types, `locales/en/home.json`, `locales/si/home.json` |
| `support/` | `content/en/public-catalog/browse-search.md`, `content/si/public-catalog/browse-search.md` |
| `spec/0034/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
npm run type-check -w support-root
```

All four completed with exit code 0. The home page was not clicked through in a browser in this session (no browser tools on this machine).

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0034: show nearby items on the public home page` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `webonone, website, support` |
| **Why** | `changed services: webonone,website,support` — product paths under `webonone-v2/`, `website/`, and `support/`; `spec/` is ignored |
| Detect command | `npm run deploy:detect -- --files <changed-path-list> --print` (working tree, before commit). `origin/deploy_staging` was current; `--head HEAD` would not yet include these files. |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
