# Feedback 0033 — Hide SMS credits card when Text.lk is not configured

| Field | Value |
|-------|-------|
| Ticket | `0033` |
| Feedback id | `tKNNQpN2UKDJ_iumib7hT` |
| Type | `bug` |
| Title | No need to show the sms credit card in dashboard if not configure |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Company owners and Super Admins see an **SMS Credits** card on the home Dashboard and on SMS → Dashboard even when the company (or platform) is not using Text.lk. That card should appear only after Text.lk is configured.

## Problem / goal

**Problem:** The credits API returns `configured: false` when Text.lk is not ready (`isTextLkReady` is false — device gateway, or Text.lk selected without a usable token). `SmsCreditsCard` still renders a “not configured” message and a Configure action. WebOnOne home reserves a fixed-height iframe for that widget. The mobile SMS dashboard shows the same prompt.

**Goal:** Do not show the SMS credit balance card unless Text.lk is configured. Keep the card (balance, refresh, last updated) when it is configured. Keep the error/retry state when the balance request fails after Text.lk is expected. Leave the separate gateway-mode stat on SMS Dashboard as it is.

## Acceptance criteria

1. **Hidden when not configured** — After the balance request succeeds with `configured: false`, the SMS Credits card is not shown on WebOnOne home Dashboard, SMS → Dashboard, or the mobile SMS dashboard. The home widget does not leave an empty fixed-height slot.
2. **Shown when configured** — When `configured: true` and a balance is present, the card still shows the balance, remaining label, Text.lk label, relative last-updated time, and refresh.
3. **Loading and errors** — While the first balance request is in flight, a loading state may appear. A failed balance request still shows the error and retry. Those states are not the unconfigured prompt.
4. **Roles unchanged** — Only company owners (`company_admin`) and Super Admins load the card. Other roles never see it.
5. **Help copy** — Support articles that tell users the unconfigured card links to Devices settings describe the new behavior: the card is omitted until Text.lk is set up.

## Services affected

| Area | Change |
|------|--------|
| `sms/` frontend | Omit the credits card on SMS Dashboard and the home embed when `configured === false`; tell the parent shell whether the widget should take space |
| `webonone-v2/` frontend | Collapse the home Dashboard credits iframe until the embed reports the widget is visible |
| `mobile/` | Omit the credits card on the SMS dashboard when `configured === false` |
| `support/` | Update Dashboard and SMS overview articles (en + si) |
| `spec/0033/` | This package |

## Out of scope

- Changing how Text.lk credentials or gateway mode are saved
- Hiding the SMS Dashboard gateway-mode / approved-devices stat cards
- New platform-embed message types in `@webonone/platform-embed`
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```
