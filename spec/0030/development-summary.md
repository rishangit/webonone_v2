# Development summary — 0030

| Field | Value |
|-------|-------|
| Ticket | `0030` |
| Feedback id | `STx2plxtRl2rTDjCnxPmt` |
| Title | Cant see the tex.lk credit balance in dash board |
| Type | `bug` |
| Completed | `2026-10-06` |

## What was delivered

WebOnOne (and mobile) SMS nav now includes **Dashboard** as the first item (`/sms/dashboard` → SMS FE `/`). Admins can open the page that already hosts the **SMS Credits** Text.lk balance card from ticket 0029. Mobile gets a matching Dashboard screen with stats + credits. Support overview clarifies Dashboard is first under SMS.

## Where to see it

| Surface | Path |
|---------|------|
| Staging WebOnOne | Left nav **SMS → Dashboard** as company owner or Super Admin |
| Credits card | Same page — remaining Text.lk credits / not configured / retry |
| Support | `/docs/communications/sms-overview` |
| Local | `npm run dev:webonone` (+ SMS) → `/sms/dashboard`; or `npm run mobile` → SMS → Dashboard |

## Feature details

- Root cause: credits lived on SMS `/` but platform nav had no Dashboard sentinel (only Send/Devices/…).
- Sentinel: `SMS_NAV_SENTINELS.dashboard` = `/sms/dashboard` → external `/`.
- WebOnOne peer frame allows `dashboard` and defaults unknown SMS paths to `/`.
- Balance API and card behavior from 0029 unchanged.
- Members still do not see the credits card.

## Code and docs touched

| Root | Key paths |
|------|-----------|
| `packages/platform-nav` | `coreNav.ts`, tests |
| `webonone-v2/frontend` | `navItems.ts`, `PlatformPeerFrame.tsx` |
| `mobile/` | `DashboardScreen`, route, `smsAdminApi.getTextLkBalance`, nav icon |
| `support/` | `sms-overview` en + si |
| `spec/0030/` | `spec.md`, `plan.md`, this summary |

## Verification run

```bash
npm run build:platform-nav
npm run test -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
npm run lint -w @webonone/webonone-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0030: show SMS Dashboard nav for Text.lk credits` |
| Workflow | Push runs `.github/workflows/deploy-staging.yml` |
| **Expected mode** | `selective` |
| **Services** | `identity`, `webonone`, `data`, `website`, `design`, `ai`, `support` |
| **Why** | `packages/platform-nav` shared-library fan-out + `support/` content (`mobile/` / `spec/` ignored for IIS) |
| Detect command | `node tooling/detect-changed-services.mjs --files <planned-paths> --print` |

## Support status

`staging` after successful push (`closed` remains super admin).
