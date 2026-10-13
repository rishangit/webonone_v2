# Development summary — Feedback 0037

| Field | Value |
|-------|-------|
| Ticket | `0037` |
| Feedback id | `UgJFYHagK0Ygo03E11ejp` |
| Title | Improve the ui web homepage |
| Type | `feature` |
| Completed | 2026-10-13 |

## What was delivered

Homepage catalog cards are tighter on a phone, and the card body matches the four requests. Nearby and search grids use an 8px gap below `md` and 12px from `md` up. The divider above the company row is gone. On viewports below `md`, tags stay on one horizontal row that scrolls. The reference count is no longer shown on the card.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging website | `https://staging.webonone.com/` — home nearby cards, and search results on the same page |
| Support | No article change (card layout only) |
| Local | `npm run dev:website` — `http://127.0.0.1:3018/` |

## Feature details

- Nearby home stays two columns below `md`. Gap is `gap-2` until `md`, then `gap-3`. Search results on the home page use the same gap and stay one column below `md`.
- Company name and logo remain at the bottom of the card, without a top border.
- Below `md`, every tag is in one non-wrapping row; swipe sideways for the rest. From `md` up, the first three tags show, with `+N` when there are more.
- `Refs: {count}` is not rendered on the public catalog card at any width.

## Code and docs touched

| Service | Paths |
|---------|--------|
| `website/` | `frontend/src/features/catalog/components/CatalogPublicItemCard.tsx`, `frontend/src/features/website/components/NearbyHomeSection.tsx`, `frontend/src/features/website/components/CatalogSearchResults.tsx` |
| `spec/0037/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```

Both completed with exit code 0. No browser tools were available in this session, so the homepage was not clicked through in a browser.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0037: improve website homepage cards` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `website` |
| **Why** | Changed paths under `website/`. `spec/` is ignored. Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (`empty git diff`) because these files were not committed yet. The same path list via `--files` returned `mode=selective`, services `website`, reason `changed services: website`. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list detect as above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
