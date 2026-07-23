# 04 — Welcome email and SMS on customer add

ClickUp: [86eyd50we](https://app.clickup.com/t/86eyd50we)

## Problem

When a company owner adds a customer, the customer should be notified. Email is always available via the Email microservice. SMS should only send when the company has configured an SMS gateway (own SIM device), so owners without a gateway are not blocked and no orphaned queue rows pile up.

## Trigger

After a successful **add customer** membership write in Identity ([03](./03-add-customer-user-selection.md)):

```text
assign member role OK
  → always: enqueue welcome EMAIL
  → if gateway configured AND user.phone present: enqueue welcome SMS
  → if notify fails: log; membership remains; optional soft warning in API meta
```

**Ownership of orchestration:** Identity backend (or a thin notify helper called from the add-customer service). Identity must not talk to SMTP/SIM directly — only Email/SMS **internal HTTP** APIs with service keys.

## Welcome email (always)

| Item | Value |
|------|--------|
| Channel | Email internal `POST /api/v1/internal/send` |
| Template slug | `welcome` |
| Scope resolution | Prefer **company** template for `companyId`; else platform `welcome` ([1.9.0](../1.9.0/03-sending-engine.md) / [1.12.0 SMS resolution pattern](../1.12.0/06-sms-templates.md)) |
| To | User’s Identity email |
| Payload (min) | `{ userName, companyName }` — extend if templates need more keys |

Company name: Identity may receive `companyName` from the client body (optional) **or** WebOnOne may expose a thin lookup — prefer passing `companyName` from Identity FE at add time **or** store no company names in Identity and pass display name from JWT/session enrichment. Acceptable v1: FE sends `companyName` on add; BE validates length and uses it only for notify payload (not persisted in Identity).

## Welcome SMS (conditional)

### When to send

| Condition | Result |
|-----------|--------|
| Company has **SMS gateway configured** AND user has non-empty **phone** | Enqueue SMS |
| No gateway | Skip SMS (no error to owner) |
| Gateway OK but no phone | Skip SMS; email still sent |

### Gateway configured

SMS service defines:

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/internal/companies/:companyId/gateway-status` | Internal key |

Response:

```json
{ "configured": true, "activeDeviceCount": 1 }
```

**Configured** = at least one gateway device registered for that `companyId` with status suitable for sending (e.g. `active` / online — match existing SMS device model). Exact column names follow current `sms` schema.

### Send

| Item | Value |
|------|--------|
| Channel | SMS internal `POST /api/v1/internal/send` |
| Template slug | `welcome` |
| `companyId` | Session company |
| `toNumber` | User phone (E.164 as stored) |
| Payload | `{ userName, companyName }` |

## Failure policy

| Failure | Membership | HTTP to owner |
|---------|------------|---------------|
| Email enqueue fails | Kept | `201` + optional `warnings: ['welcome_email_failed']` |
| SMS enqueue fails | Kept | `201` + optional `warnings: ['welcome_sms_failed']` |
| Gateway check fails | Kept | Treat as not configured (skip SMS); log |

Never roll back `users_roles` because notifications failed.

## Env (Identity backend)

```env
EMAIL_API_BASE_URL=
EMAIL_SERVICE_API_KEY=
SMS_API_BASE_URL=
SMS_SERVICE_API_KEY=
```

Document in `identity/backend/.env.example`. Same pattern as WebOnOne ↔ Email ([1.9.0](../1.9.0/05-platform-integration.md)).

## Acceptance

1. Add customer → Email History/queue shows company welcome send (or platform fallback).
2. No gateway → no SMS queue row; add still succeeds.
3. Gateway + phone → SMS queued with company `welcome`.
4. Notify outage does not undo membership.
