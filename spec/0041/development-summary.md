# Development summary — Feedback 0041

| Field | Value |
|-------|-------|
| Ticket | `0041` |
| Feedback id | `kqzLPEzUonaHsIQHoW91B` |
| Title | Can see the extra space in logo left side |
| Type | `bug` |
| Completed | 2026-10-13 |

## What was delivered

The WebOnOne header logo button no longer keeps the default size padding that appears when a button contains an SVG. The mark sits on the header row inset only. Clicking the logo still opens the public homepage.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | Signed-in WebOnOne header at `https://app.webonone.com` — logo at the left of the header bar |
| Support docs | none (behavior of the logo link is unchanged) |
| Local | `npm run dev:webonone` — open the app and look at the header logo |

## Feature details

- Logo control uses `!px-0` so `Button` size `has-[svg]:px-6` does not add space on the left of the mark.
- Header content padding (`px-2` below `sm`, `sm:px-6`) is unchanged.
- Homepage click and the accessible name are unchanged.

## Code and docs touched

| Root | Paths |
|------|--------|
| `webonone-v2/` | `frontend/src/app/AppLayout.tsx` |
| `spec/0041/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
```

Both completed with exit code 0. Lint reported 7 existing warnings in other files and 0 errors.

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` before this commit returned `mode=none` (`empty git diff`) because the fix was still uncommitted. Path prediction for the files in this commit (`--files`) is below. `spec/` is ignored for IIS.

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0041: remove extra space left of header logo` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `webonone` |
| **Why** | `changed services: webonone` |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit; post-commit diff is `webonone-v2/` only) |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
