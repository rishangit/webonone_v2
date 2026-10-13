# Development summary — Feedback 0038

| Field | Value |
|-------|-------|
| Ticket | `0038` |
| Feedback id | `AZz6-PeZo1XImCs2DCwsp` |
| Title | Increase the width of the web mobile item details page |
| Type | `feature` |
| Completed | 2026-10-13 |

## What was delivered

On a phone, the public catalog item details page no longer adds a 16px side gutter. The location bar and the detail body use the full width of the shell content area (`px-0` below `sm`). From `sm` up, the page still uses `sm:px-8`. A new `web-mobile-view` skill records that phone-width web item details should stay at that maximum width so later mobile UI can match the Expo app.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging website | `https://staging.webonone.com/` — open any catalog card, then the item page (`/catalog/:kind/:id`) at a phone width (below 640px) |
| Support | No article change (page width only) |
| Local | `npm run dev:website` — `http://127.0.0.1:3018/catalog/<kind>/<id>` |

## Feature details

- Below `sm`, the location bar and the scrolling detail column have `px-0`. The website shell `p-2` is the only horizontal inset, in line with the app `FeatureScreen` `px-2` content inset.
- From `sm` up, those wrappers keep `sm:px-8`. The `max-w-[100rem]` column is unchanged.
- The home page gutters are unchanged.
- Agents aligning other phone-width web layouts should follow `.cursor/skills/web-mobile-view/SKILL.md` (indexed in `AGENTS.md`).

## Code and docs touched

| Service | Paths |
|---------|--------|
| `website/` | `frontend/src/features/website/pages/CatalogDetailPage.tsx` |
| `.cursor/skills/web-mobile-view/` | `SKILL.md` |
| Repo root | `AGENTS.md` |
| `spec/0038/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```

Both completed with exit code 0. No browser tools were available in this session, so the item page was not opened in a phone viewport.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0038: increase mobile item details width` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `website` |
| **Why** | Changed paths under `website/`. `spec/`, `.cursor/`, and `AGENTS.md` are ignored for IIS. Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (`empty git diff`) because these files were not committed yet. The same path list via `--files` returned `mode=selective`, services `website`, reason `changed services: website`. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list detect as above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
