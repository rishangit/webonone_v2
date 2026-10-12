# Development summary — Feedback 0035

| Field | Value |
|-------|-------|
| Ticket | `0035` |
| Feedback id | `ZTWqVok5dfH_de4MrpLgo` |
| Title | Webonone web home page ui improvements in mobile |
| Type | `feature` |
| Completed | 2026-10-12 |

## What was delivered

The public website home content now uses the same width as the header bar: the extra `px-4` / `sm:px-8` inset on the search band and page body is gone. Nearby catalog cards on that home view show two per row below the `md` breakpoint. Wider breakpoints keep the existing column counts. Search-result grids stay one column on a phone.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | Public website home (`/` on the website host). Narrow the browser to a phone width. |
| Support | `/docs/public-catalog/browse-search` (en and si) |
| Local | `npm run dev:website` — open `/` |

## Feature details

- Search field, location bar, and nearby cards line up with the header bar edges.
- Nearby item cards use two columns from the smallest width through `sm`.
- From `md` up: 2, then 3 (`lg`), 4 (`xl`), and 5 (`2xl`) columns, same as before.
- A typed search on the same page still uses the shared one-column mobile grid.

## Code and docs touched

| Root | Paths |
|------|--------|
| `website/` | `frontend/src/features/website/pages/WebsiteHomePage.tsx`, `frontend/src/features/website/components/NearbyHomeSection.tsx` |
| `support/` | `frontend/src/content/en/public-catalog/browse-search.md`, `frontend/src/content/si/public-catalog/browse-search.md` |
| `spec/0035/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
npm run type-check -w support-root
```

Passed. Browser click-through was not run (no browser tools in this session).

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0035: mobile home full width and two-up cards` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `website, support` |
| **Why** | Changed paths under `website/` and `support/`. `spec/` is ignored. Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (`empty git diff`) because these files were not committed yet. The same path list via `--files` returned `mode=selective`, services `website,support`, reason `changed services: website,support`. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list detect as above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
