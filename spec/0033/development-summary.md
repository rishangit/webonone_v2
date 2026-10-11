# Development summary — Feedback 0033

| Field | Value |
|-------|-------|
| Ticket | `0033` |
| Feedback id | `tKNNQpN2UKDJ_iumib7hT` |
| Title | No need to show the sms credit card in dashboard if not configure |
| Type | `bug` |
| Completed | 2026-10-11 |

## What was delivered

The SMS Credits card is omitted when the balance API reports Text.lk is not configured. Company owners and Super Admins still see the balance, refresh, and last-updated time when Text.lk is set up. A failed balance request still shows an error and retry. The home Dashboard no longer keeps a blank slot for the hidden widget.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging home Dashboard | https://staging-app.webonone.com/ — Dashboard, company owner or Super Admin |
| Staging SMS Dashboard | SMS → Dashboard (same shell) |
| Support | `/docs/app-preferences/dashboard`, `/docs/communications/sms-overview` |
| Local | `npm run dev:webonone`, `npm run dev:sms`, `npm run mobile` |

## Feature details

- `configured: false` (device gateway, or Text.lk selected without a usable token) hides the card on the WebOnOne home Dashboard, SMS → Dashboard, and the mobile SMS dashboard.
- The home iframe stays in the page at zero height until the SMS embed posts `webonone:sms:credits-widget` with `visible: true` to the allowlisted parent origin.
- While the first request is in flight, SMS Dashboard and mobile may show a loading card. The home widget stays collapsed until the result says the card should show.
- Gateway-mode and approved-device stat cards on SMS Dashboard are unchanged.
- Roles are unchanged: only `company_admin` and `super_admin`.

## Code and docs touched

| Area | Paths |
|------|--------|
| SMS frontend | `sms/frontend/src/features/dashboard/components/SmsCreditsCard.tsx`, `pages/DashboardPage.tsx`, `pages/SmsCreditsEmbedPage.tsx` |
| WebOnOne frontend | `webonone-v2/frontend/src/features/sms/components/SmsCreditsFrame.tsx` |
| Mobile | `mobile/src/features/sms/screens/DashboardScreen.tsx` |
| Support | `support/frontend/src/content/en/app-preferences/dashboard.md`, `en/communications/sms-overview.md`, and the `si` copies |
| Spec | `spec/0033/` |

## Verification run

```bash
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
npm run test -w @webonone/sms-frontend
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

Lint reported only existing warnings in untouched list files. SMS credit view-state tests passed (6).

Browser check of the live dashboards was not run in this session (no browser tools). The hide rule is covered by the view-state helper and the `configured !== false` render gates.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0033: hide SMS credits card when Text.lk is not configured` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `webonone, sms, support` |
| **Why** | `changed services: webonone,sms,support` — `mobile/` and `spec/` do not map to IIS |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before this commit because the diff was uncommitted; path list for the same files returned `selective` / `webonone,sms,support`) |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`. `closed` stays with a super admin.
