# Feedback 0031 — Unable to retrieve SMS balance

| Field | Value |
|-------|-------|
| Ticket | `0031` |
| Feedback id | `uahK_56Vpc5IwwF4hKULM` |
| Type | `bug` |
| Title | Unable to retrieve SMS balance |
| Reporter | noreply@webonone.com |
| Attachment | none |
| Related | `0029` (credits card + balance API), `0030` (Dashboard nav) |

## Overview

Ticket **0029** added Text.lk SMS credits on the SMS Dashboard. When Text.lk is configured, admins still see **"Unable to retrieve SMS balance"** (502 `PROVIDER_ERROR` / card error state) because the balance JSON parser does not recognize the live provider field shape.

## Problem / goal

**Problem:** `GET /api/v1/providers/textlk/balance` calls Text.lk successfully (or receives a success-shaped body), but `parseTextLkBalanceBody` returns `null` when the credit amount lives under fields such as `data.remaining_balance` (same API-v3 pattern used by sibling Sri Lanka gateways). That is mapped to a generic provider error, so the dashboard card never shows credits.

**Goal:** Parse the real Text.lk balance payload so configured scopes show remaining SMS credits; keep not-configured / auth / network failures distinct; do not expose tokens.

## Acceptance criteria

1. **Parse `remaining_balance`** — Success bodies with `data.remaining_balance` (number or numeric string) resolve to a finite balance.
2. **Existing shapes still work** — `data.balance`, `data.credits`, `data.credit`, `data.sms_balance`, `data.remaining`, top-level `balance`/`credits`, numeric `data`.
3. **Boolean status** — Treat Text.lk `status: false` (and string `"error"`) as provider failure, not malformed success.
4. **Configured + valid token** — Company admin / super admin with Text.lk ready get `configured: true` and a numeric `balance` (not 502) when Text.lk returns a supported success body.
5. **Auth / network failures** — Invalid credentials and transport failures still yield a friendly error + Retry (no secrets in API/UI).
6. **Tests** — Unit tests cover `remaining_balance` and boolean `status: false`.
7. **No nav/help churn** — Dashboard nav (0030) and Support copy stay as-is unless wording is wrong.

## Services affected

| Area | Change |
|------|--------|
| `sms/backend` | `parseTextLkBalanceBody` / `fetchTextLkBalance`; provider error logging; unit tests |
| `spec/0031/` | This package |

## Out of scope

- Replacing Text.lk credentials storage or Devices → Settings UX
- WebOnOne home dashboard credits card
- Changing role gates or balance DTO shape
- Setting Support status `closed`

## Verification

```bash
npm run test -w @webonone/sms-backend
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
```
