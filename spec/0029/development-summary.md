# Development summary — 0029

| Field | Value |
|-------|-------|
| Ticket | `0029` |
| Feedback id | `xUsPClctstB2H8CPJORCy` |
| Title | Text.lk SMS Credit Balance on Dashboards |
| Type | `feature` |
| Completed | `2026-10-06` |

## What was delivered

SMS Dashboard shows an **SMS Credits** card for `company_admin` and `super_admin`. Balance is loaded through SMS backend `GET /api/v1/providers/textlk/balance`, which calls Text.lk `GET /api/v3/balance` with the stored scope credentials (never exposed to the browser). Configured / not-configured / loading / error / refresh states match the spec; tenant scope comes from the JWT.

## Where to see it

| Surface | Path |
|---------|------|
| Staging SMS | Open SMS → **Dashboard** as company owner or Super Admin (with Text.lk configured under Devices → Settings) |
| Configure CTA | `/devices?tab=settings` |
| Support | `/docs/communications/sms-overview`, `/docs/communications/sms-devices` |
| Local | `npm run dev:sms` → `http://127.0.0.1:3016/` |

## Feature details

- Company admins see company Text.lk balance; Super Admins see platform balance.
- Members do not see the card; API returns 403 for non-admins.
- Not configured → message + Configure SMS (company and platform).
- Provider errors → friendly message + Retry; refresh uses `force=1` and bypasses 60s cache.
- Credentials remain AES-encrypted server-side (`hasApiToken` pattern unchanged).

## Code and docs touched

| Root | Key paths |
|------|-----------|
| `sms/backend` | `textLkProvider.service.ts`, `providerBalance.service.ts`, `providers.routes.ts`, unit tests |
| `sms/frontend` | `SmsCreditsCard`, `smsCreditsStore`, `DashboardPage`, shell i18n |
| `support/` | `sms-overview`, `sms-devices` (en + si) |
| `spec/0029/` | `spec.md`, `plan.md`, this summary |

## Verification run

```bash
npm run test -w @webonone/sms-backend
npm run test -w @webonone/sms-frontend
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
npm run type-check -w support-root
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0029: Text.lk SMS credit balance on dashboards` |
| Workflow | Push runs `.github/workflows/deploy-staging.yml` |
| **Expected mode** | `selective` |
| **Services** | `sms`, `support` |
| **Why** | Changed paths under `sms/` and `support/` (`spec/` ignored for IIS) |
| Detect command | `node tooling/detect-changed-services.mjs --files <planned-paths> --print` (working tree vs empty HEAD diff before commit) |

## Support status

`staging` after successful push (`closed` remains super admin).
