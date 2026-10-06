# Feedback 0030 — Cant see the Text.lk credit balance in dashboard

| Field | Value |
|-------|-------|
| Ticket | `0030` |
| Feedback id | `STx2plxtRl2rTDjCnxPmt` |
| Type | `bug` |
| Title | Cant see the tex.lk credit balance in dash board |
| Reporter | noreply@webonone.com |
| Attachment | none |
| Related | `0029` (feature delivered; card on SMS Dashboard) |

## Overview

Ticket **0029** added an **SMS Credits** card on the SMS service Dashboard (`/`) for `company_admin` and `super_admin`. Admins still cannot see it when using WebOnOne because the **platform SMS nav has no Dashboard item** — shell users only reach Send / Devices / Queue / History / Templates.

## Problem / goal

**Problem:** Credits card exists on SMS Dashboard, but WebOnOne core nav (`SMS_PLATFORM_NAV_GROUP` / `SMS_NAV_SENTINELS`) omits Dashboard. Support docs already say **SMS → Dashboard**. Users opening SMS from the shell never land on `/` where the card renders.

**Goal:** Expose **SMS → Dashboard** in WebOnOne (and mobile) platform nav so admins can open the page that shows Text.lk credit balance.

## Acceptance criteria

1. **Nav item** — Platform SMS group includes **Dashboard** (first item), sentinel maps to SMS FE `/`.
2. **Shell route** — WebOnOne `/sms/dashboard` embeds SMS Dashboard (iframe); path allowed for peer navigate.
3. **Icons** — Web and mobile nav show a dashboard icon for the new sentinel.
4. **Credits card unchanged** — Existing `SmsCreditsCard` on SMS Dashboard still shows for company admin / super admin (configured / not-configured / error / refresh).
5. **Help** — Support SMS overview still describes **SMS → Dashboard** credits; adjust only if nav wording needs clarification.
6. **Tests** — `platform-nav` sentinel / path mapping tests cover dashboard.

## Services affected

| Area | Change |
|------|--------|
| `packages/platform-nav` | `SMS_NAV_SENTINELS.dashboard`, group child, `isSmsNavSentinel` / `smsSentinelToExternalPath`, unit tests |
| `webonone-v2/frontend` | Nav icon map; `isAllowedSmsShellNavigatePath` allows `dashboard` |
| `mobile/` | Nav icon map for dashboard sentinel |
| `support/` | Help tweak only if needed |
| `spec/0030/` | This package |

## Out of scope

- Re-implementing Text.lk balance API (already in 0029)
- Putting credits on WebOnOne home calendar dashboard
- Changing role gates or balance DTO
- Setting Support status `closed`

## Verification

```bash
npm run build:platform-nav
npm run test -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```
