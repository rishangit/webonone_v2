# Development summary — 0047

| Field | Value |
|-------|-------|
| Ticket | `0047` |
| Feedback id | `Yb-uqqHM70zZRWnzbmOwZ` |
| Title | The super admin login dashboard must display pending companies. |
| Type | `feature` |
| Completed | 2026-10-19 |

## What was delivered

After a Super Admin signs in, Dashboard shows **Pending**, **Approved**, and **Rejected** cards with company counts, and a **Pending companies** list (newest first). Opening a row opens that company’s profile. Company owners, staff, and members still see today’s and upcoming events. Super Admins and company owners still see **SMS Credits** when Text.lk is set up. The same Super Admin cards and list are on the mobile Dashboard.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | Sign in, choose **Super Admin**, open **Dashboard**. Pending row opens the company profile. **Companies → All Companies** is unchanged. |
| Local web | `npm run dev:webonone` — home route `/` as Super Admin |
| Mobile | `npm run mobile` — Dashboard as Super Admin. A row opens `/companies/:companyId`. |
| Support | `/docs/app-preferences/dashboard` (`en` and `si`) |

## Feature details

- Counts come from every company returned by `GET /api/v1/company/admin/companies`.
- The list includes only **pending** companies, sorted by created date, newest first. Empty copy: “No pending companies.”
- Approve and reject stay on the company profile and All Companies.
- Other roles do not see the cards or the pending list.

## UI reuse

- Screen: Super Admin Dashboard status cards and pending list.
- Similar UI: `AnalyticsStatCard` (web), SMS dashboard `StatCard` (mobile), `CompaniesList` row (logo, name, status, date).
- Kit export: `Card`, `ItemList`, `ItemListItem`, `ItemListEmpty`, `StatusTag`, `ImagePreview`.
- Action: extract-then-reuse. Web stat card moved to `shared/components/StatCard.tsx` (Analytics call sites updated). Mobile SMS stat card moved to `mobile/src/shared/components/StatCard.tsx`.
- Pending list is a new home component. It does not reuse `CompaniesList` because that list includes approve/reject menus.

## Code and docs touched

| Area | Paths |
|------|--------|
| `webonone-v2/frontend` | `HomePage`, `PendingCompaniesList`, `adminCompaniesApi`, home dashboard slice/epics, `StatCard`, `home.json` (`en`/`si`) |
| `mobile/` | `DashboardScreen`, `PendingCompaniesList`, `adminCompaniesApi`, shared `StatCard`, SMS dashboard import |
| `support/` | `app-preferences/dashboard.md` (`en` + `si`) |
| `spec/0047/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. Web lint reported existing warnings only (0 errors). Browser tools were not available in this session, so the Dashboard was not clicked through in a browser.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0047: super admin dashboard pending companies` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `webonone, support` |
| **Why** | `changed services: webonone,support` — `mobile/` and `spec/` are ignored for IIS |
| Detect command | `npm run deploy:detect -- --files spec/0047/_detect-files.txt --print` (working tree; `HEAD` did not yet include this commit) |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
