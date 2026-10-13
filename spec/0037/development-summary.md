# Development summary — Feedback 0037

| Field | Value |
|-------|-------|
| Ticket | `0037` |
| Feedback id | `UgJFYHagK0Ygo03E11ejp` |
| Title | Improve the ui web homepage |
| Type | `feature` |
| Completed | 2026-10-13 |

## What was delivered

On the public website home page, the space between catalog item cards is smaller on phone-width layouts. Nearby cards and search-result cards use an 8px grid gap (`gap-2`) below the `md` breakpoint. From `md` up the gap stays 12px (`gap-3`). Column counts and card contents are unchanged.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging website | `https://staging.webonone.com/` — home nearby cards, and search results on the same page |
| Support | No article change (spacing only) |
| Local | `npm run dev:website` — `http://127.0.0.1:3018/` |

## Feature details

- Nearby home stays two columns below `md`. The gap between those cards is `gap-2` until `md`, then `gap-3`.
- Search results on the home page use the same gap rule. They stay one column below `md`.
- UI Kit’s shared card-grid default is unchanged, so admin collection grids stay at `gap-3`.

## Code and docs touched

| Service | Paths |
|---------|--------|
| `website/` | `frontend/src/features/website/components/NearbyHomeSection.tsx`, `frontend/src/features/website/components/CatalogSearchResults.tsx` |
| `spec/0037/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```

Both completed with exit code 0. The homepage was not opened in a browser in this session.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0037: tighten homepage card gap on mobile` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `website` |
| **Why** | Changed paths under `website/`. `spec/` is ignored. Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (`empty git diff`) because these files were not committed yet. The same path list via `--files` returned `mode=selective`, services `website`, reason `changed services: website`. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list detect as above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
