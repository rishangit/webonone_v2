# 01 — Overview (1.16.0)

## Vision

The platform gains a dedicated **Payment microservice** that owns billing and invoices for **system** charges and (in later releases) **customer** payments. It runs standalone — own frontend, backend, and MySQL database — and connects to WebOnOne through the same contracts as Email/SMS/Data: Identity JWT, versioned HTTP APIs, and platform-nav handoff.

**1.16.0** delivers the first slice: **system subscription billing**. Every approved (activated) company is billed **LKR 3,000 per month**, with the billing clock starting on the company's **activation date**. Super admins review **all companies' invoices** in one list.

## User story

As a **super admin** on the WebOnOne platform, I want a Payment service that automatically creates monthly invoices for each activated company at Rs 3,000 starting from their activation date, and I want to see every company's invoices in one place, so that platform subscription billing is tracked without embedding payment logic inside WebOnOne.

## Goals (1.16.0)

1. **Standalone Payment service** — `payment/frontend`, `payment/backend`, `payment/backend/migrations`, own MySQL schema `webonone_payment`; `npm run dev:payment` and `/health` without other services.
2. **Identity auth handoff** — JWT from Identity; `platform_role` / `company_id` drive nav and API authorization (same pattern as Email/SMS).
3. **System billing plan** — Single platform plan: **LKR 3,000 / month** per activated company.
4. **Activation-based billing** — Billing start = company activation datetime (`approved_at` from WebOnOne), synced into Payment as a local copy.
5. **Invoice engine** — Generate monthly system invoices per company; idempotent per period; statuses for issued / paid / overdue / void.
6. **Super-admin invoices list** — Payment FE list of **all** system invoices across companies; reachable from WebOnOne super-admin nav.
7. **WebOnOne connect** — On company approve, WebOnOne notifies Payment; nav entry for Payment Invoices; no shared DB.

## Scope (1.16.0)

### In scope

- New `payment/` workspace (FE **3017**, BE **4017**).
- DB: company mirror, billing subscriptions, invoices, invoice line items, audit log.
- Internal API (service key): upsert company activation, trigger/backfill invoice generation.
- Public API (JWT): list/filter invoices (super admin = all; company admin = own company read-only optional), get invoice detail, mark paid / void (super admin).
- Billing worker: daily (or interval) job that issues due monthly invoices.
- Payment admin UI: Dashboard + Invoices list (+ detail).
- WebOnOne: call Payment on approve; `VITE_PAYMENT_ORIGIN`; platform-nav Payment group for super admin.
- Root workspace scripts: `dev:payment`, `build:payment`, `migrate:payment`; append to root `dev`.

### Out of scope (1.16.0)

- **Customer payments** (end-customer checkout, company→customer invoices) — deferred.
- **Payment gateways** (card, bank transfer auto-reconcile, PayHere / Stripe / etc.) — deferred; v1 records payment status manually.
- Proration of the first partial month (v1 bills **full LKR 3,000** for each period starting at activation).
- Tax / VAT line items, credit notes, multi-currency (v1 = LKR only).
- Company-admin self-serve pay flow or portal beyond optional read of own invoices.
- Dunning emails/SMS (may call Email/SMS later; not required in 1.16.0).
- Changing the monthly amount via UI (env/seed constant is enough; plan table may exist for future).

## Glossary

| Term | Definition |
|------|------------|
| **System payment** | Platform charge to a company (subscription), owned by Payment service |
| **Customer payment** | Future: company charging its own customers — **not** in 1.16.0 |
| **Activation date** | Instant the company became billable — WebOnOne `companies.approved_at`; stored on Payment as `activated_at` |
| **Billing period** | One month window for a subscription invoice, anchored to activation day-of-month |
| **System invoice** | Invoice with `kind = system_subscription`, amount **LKR 3,000**, one company |
| **Plan** | Catalog row for platform pricing; v1 has one active plan `platform_monthly` @ 3000 LKR |
| **Subscription** | Per-company billing enrollment (`active` while company remains approved) |
| **Internal API** | Server-to-server Payment routes authenticated with `X-Payment-Service-Key` |

## Billing rules (normative for 1.16.0)

1. Amount: **LKR 3,000.00** per month per activated company (currency code `LKR`).
2. Start: first period begins at **`activated_at`** (date portion in Asia/Colombo, or UTC documented in env — default **Asia/Colombo**).
3. Period length: successive **1-month** intervals from that start (same day-of-month; if day missing in target month, use last day of month).
4. Invoice issue: when a period **starts** (or on backfill for past periods since activation), create one invoice if none exists for `(company_id, period_start)`.
5. Only companies with an **active** Payment subscription (mirroring approved/activated state) are billed.
6. Rejected or deactivated companies: stop new invoices; existing invoices remain.

Example: company activated `2026-03-15` → periods `[2026-03-15, 2026-04-15)`, `[2026-04-15, 2026-05-15)`, … each invoice **LKR 3,000**.

## Success criteria

1. `npm run dev:payment` serves Payment admin UI at `:3017` and API at `:4017/health`.
2. Approving a company in WebOnOne upserts the company + `activated_at` into Payment and creates/activates a subscription.
3. Invoice worker (or backfill) creates monthly system invoices at LKR 3,000 from activation without duplicates.
4. Super admin opens **Payment → Invoices** (from WebOnOne or Payment standalone) and sees **all** companies' system invoices with company name, period, amount, status, due date.
5. Super admin can open invoice detail and mark **paid** or **void**.
6. Payment starts and `/health` works when WebOnOne is down; sync features degrade until WebOnOne is back.
7. `npm run type-check -w payment-root` passes; migrations apply cleanly; no shared DB with WebOnOne.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — Payment microservice (system billing) | TBD | All |
| Payment service scaffold | TBD | [02-payment-service-scaffold.md](./02-payment-service-scaffold.md) |
| System billing + invoices engine | TBD | [03-system-billing-and-invoices.md](./03-system-billing-and-invoices.md) |
| Super-admin invoices UI | TBD | [04-super-admin-invoices-ui.md](./04-super-admin-invoices-ui.md) |
| Platform integration and release | TBD | [05-platform-integration.md](./05-platform-integration.md) |
