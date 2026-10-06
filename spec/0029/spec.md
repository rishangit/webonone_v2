# Feedback 0029 — Text.lk SMS Credit Balance on Dashboards

| Field | Value |
|-------|-------|
| Ticket | `0029` |
| Feedback id | `xUsPClctstB2H8CPJORCy` |
| Type | `feature` |
| Title | Text.lk SMS Credit Balance on Dashboards |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Company owners (`company_admin`) and Super Admins need to see remaining Text.lk SMS credits on the SMS dashboard without leaving WebOnOne. Balance is fetched server-side from Text.lk using the already-stored gateway credentials (company vs platform scope).

## Problem / goal

**Problem:** Admins must log into Text.lk to check remaining SMS credits. WebOnOne already stores Text.lk tokens per scope but does not surface balance.

**Goal (MVP):** On the SMS service dashboard, show an SMS Credits card for `company_admin` / `super_admin` with configured / not-configured / loading / error / refresh states. Backend calls Text.lk; frontend never talks to Text.lk.

## Acceptance criteria

1. **Company balance** — Given company Text.lk is ready (`mode=text_lk` + token + sender), Company Owner sees balance on SMS Dashboard.
2. **Company not configured** — Card shows “Text.lk is not configured” and a link/button to **SMS → Devices → Settings** (`/devices?tab=settings`).
3. **Tenant isolation** — Balance uses JWT `company_id` / role; company admins cannot read another company’s or platform balance.
4. **Platform balance** — Super Admin sees platform-scope Text.lk balance when configured.
5. **Platform not configured** — Super Admin sees not-configured state (no Configure CTA required beyond message, or same Devices settings for platform).
6. **Loading** — While fetching, show loading (platform overlay / spinner); never show `0` as a fake balance.
7. **Provider error** — Friendly error + Retry; no credentials or raw provider secrets in UI/API.
8. **Manual refresh** — Refresh action re-fetches via SMS backend (bypass short cache when forced).
9. **Security** — Token stays server-side (existing AES encrypted config); response never includes token.
10. **Tests** — Backend unit tests for success, not configured, API failure, invalid credentials, timeout/malformed response, auth/scope; FE helper tests for relative “last updated” / display states where practical.
11. **Help** — Support article notes the dashboard credits card.

## Text.lk balance endpoint (verified)

Official Text.lk PHP SDK (`textlk/textlk-php` `TextLKSMSMessage::getBalance`) calls:

```http
GET https://app.text.lk/api/v3/balance
Authorization: Bearer <api_token>
Accept: application/json
```

Public HTML docs currently document send/view SMS only; the balance path is confirmed from the published SDK (same `/api/v3/` base as send). Implementation must parse the JSON flexibly and stay isolated in `textLkProvider.service`.

## API (SMS microservice)

```http
GET /api/v1/providers/textlk/balance
Authorization: Bearer <JWT>
```

Roles: `super_admin` | `company_admin`.

Success (configured):

```json
{
  "provider": "textlk",
  "configured": true,
  "balance": 1245,
  "unit": "SMS",
  "lastUpdated": "2026-10-06T07:30:00.000Z"
}
```

Not configured:

```json
{
  "provider": "textlk",
  "configured": false,
  "balance": null,
  "unit": "SMS",
  "lastUpdated": null
}
```

Provider failure: `502` with `{ "message": "…", "code": "PROVIDER_ERROR" }` (no secrets).

Short in-memory cache (~60s) per scope key to limit Text.lk traffic; `?force=1` or refresh bypasses cache.

## Services affected

| Area | Change |
|------|--------|
| `sms/backend` | Provider balance fetch, cache, route/controller, unit tests |
| `sms/frontend` | Dashboard SMS Credits card, store/epic, i18n |
| `support/` | Help update for SMS dashboard / devices |
| `spec/0029/` | This package |

## Out of scope

- WebOnOne home calendar page credits card (SMS dashboard only for MVP)
- Non–Text.lk provider balances
- Storing balance history in MySQL
- Changing Text.lk credential storage
- Mobile app dashboard card
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
npm run test -w @webonone/sms-backend
npm run type-check -w support-root
```
