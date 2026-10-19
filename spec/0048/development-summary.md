# Development summary — 0048

| Field | Value |
|-------|-------|
| Ticket | `0048` |
| Feedback id | `xPV94dSFL17Atc1f80fPg` |
| Title | Keep only the pending company list card |
| Type | `bug` |
| Completed | 2026-10-19 |

## What was delivered

The Super Admin Dashboard now shows only the pending-company list. Status count cards and the home SMS Credits card are gone for that role. The list stays at the height of the companies shown, up to three rows, and scrolls inside the card when there are more. Company owners still see events and SMS Credits. The same pending-list layout is on the mobile Super Admin Dashboard. English and Sinhala help articles match.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging web | https://app.webonone.com/ — sign in as Super Admin, open **Dashboard** |
| Staging help | https://support.webonone.com/docs/app-preferences/dashboard |
| Local web | `npm run dev:webonone` — Super Admin home |
| Local mobile | `npm run mobile` — Super Admin Dashboard |

## Feature details

- Super Admin home is a single **Pending companies** card (newest first). A row still opens the company profile.
- More than three pending companies: scroll inside the card. Fewer than three: the card is only as tall as the rows. Empty list: “No pending companies.”
- Company owners still see today’s events, upcoming events, and SMS Credits when Text.lk is set up. Super Admins still see SMS Credits on **SMS → Dashboard**.

## Code and docs touched

| Area | Paths |
|------|--------|
| `webonone-v2/frontend` | `HomePage.tsx`, `PendingCompaniesList.tsx`, home dashboard store, `locales/{en,si}/home.json` |
| `mobile/` | `DashboardScreen.tsx`, `PendingCompaniesList.tsx` |
| `support/` | `content/{en,si}/app-preferences/dashboard.md`, `content/{en,si}/communications/sms-overview.md` |
| `spec/0048/` | `spec.md`, `plan.md`, this file |

UI reuse: existing pending `Card` + `PendingCompaniesList` (`ItemList`, `ImagePreview`, `StatusTag`). No new card primitive. `StatCard` remains on Analytics and the SMS dashboard.

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. Web lint reported existing warnings in other features, no errors in the dashboard files.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0048: Keep only the pending company list card` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `webonone, support` |
| **Why** | `webonone-v2/` and `support/` changed. `mobile/` and `spec/` are ignored for IIS. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
