---
name: payment-agent
description: >-
  Payment service agent for webonone-platform. Handles payment/ frontend,
  backend, migrations — system subscription invoices (LKR 3000/month from
  company activation), super-admin invoices list, WebOnOne approve sync.
  Use when tasks touch payment/, Payment API, or WebOnOne Payment nav.
---

# Payment agent skill

## Scope

- `payment/frontend`, `payment/backend`, `payment/backend/migrations`
- WebOnOne consumer: `paymentClient.service.ts`, Payment nav / PlatformPeerFrame

## Model

- **System billing only (1.16.0):** LKR 3,000/month from company `activated_at`.
- **Internal auth:** `X-Payment-Service-Key` for `/internal/*`.
- **JWT:** local verify; `platform_role` / `company_id` from claims.
- **No shared DB** with WebOnOne; `company_id` is a CHAR(21) copy.

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc)
- [feature-store skill](../feature-store/SKILL.md)
- [item-list skill](../item-list/SKILL.md)
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc)
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc)

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3017 | `payment/frontend/.env` |
| Backend | 4017 | `payment/backend/.env` |

Key backend env: `PAYMENT_SERVICE_API_KEY`, `SYSTEM_MONTHLY_AMOUNT_LKR`, `BILLING_TIMEZONE`, `INVOICE_DUE_DAYS`.

## Key paths

- Migrations: `payment/backend/migrations/`
- Services: `company.service`, `invoice.service`, `billingPeriod.ts`
- Worker: `workers/invoiceGenerator.ts`
- FE: `features/invoices/`, `features/dashboard/`

## Verification

```bash
npm run migrate -w payment-root
npm run type-check -w payment-root
npm run test -w @webonone/payment-backend
npm run dev:payment
```
