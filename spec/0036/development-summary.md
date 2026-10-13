# Development summary — Feedback 0036

| Field | Value |
|-------|-------|
| Ticket | `0036` |
| Feedback id | `VBclm-eCsM0eBUC9GOfOp` |
| Title | When refreshing the website always asks location permission |
| Type | `bug` |
| Completed | 2026-10-13 |

## What was delivered

After the public website receives a precise location, it stores the coordinates and place label in `localStorage`. A refresh of home or catalog detail restores that place immediately and does not open the in-app location dialog. The site calls the browser geolocation API on load only when permission is already `granted`. A browser block clears the saved fix. The location-bar refresh control still requests a new reading from a click.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging website | `https://staging.webonone.com/` (home location bar) |
| Catalog detail | `https://staging.webonone.com/` — open any nearby card |
| Support | No article change (bug fix; browse copy already describes location) |
| Local | `npm run dev:website` — `http://127.0.0.1:3018/` |

## Feature details

- Saved key is `website.userLocation` (latitude, longitude, place label, time). Approximate IP location is not saved as a precise fix.
- Refresh with a saved fix does not call `getCurrentPosition` when the Permissions API reports `prompt` or is unsupported, so the browser permission UI does not appear again.
- When the Permissions API reports `granted`, the site refreshes coordinates in the background and keeps the saved label on screen.
- The refresh icon on the location bar still requests a new GPS reading.
- `PERMISSION_DENIED` removes the saved fix and falls back to approximate location, with the existing unlock dialog when the visitor has not dismissed it this tab.

## Code and docs touched

| Service | Paths |
|---------|--------|
| `website/` | `frontend/src/features/website/hooks/useUserLocation.ts` |
| `spec/0036/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```

Both completed with exit code 0. Browser permission prompts were not driven here (no browser automation in this session).

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0036: remember website location across refresh` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `website` |
| **Why** | Changed path under `website/`. `spec/` is ignored. Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (`empty git diff`) because these files were not committed yet. The same path list via `--files` returned `mode=selective`, services `website`, reason `changed services: website`. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list detect as above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
