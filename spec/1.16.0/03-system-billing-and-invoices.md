# 03 — System billing and invoices (1.16.0)

Domain model, activation sync, monthly invoice generation, and APIs for **system subscription** billing. Implements ClickUp subtask **TBD**.

## Domain model

```text
payment_plans (seed: platform_monthly @ LKR 3000 / month)
        │
        ▼
payment_subscriptions  ──1:N──►  payment_invoices  ──1:N──►  payment_invoice_lines
        │                              │
        └── company_id (copy)          └── company_id, period_start/end, status, amounts
```

### `payment_plans`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `slug` | VARCHAR | Unique — `platform_monthly` |
| `name` | VARCHAR | e.g. Platform subscription |
| `amount_minor` | BIGINT | `300000` (= LKR 3,000.00) |
| `currency` | CHAR(3) | `LKR` |
| `interval` | ENUM | `month` |
| `active` | BOOLEAN | true for seeded plan |

### `payment_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `company_id` | CHAR(21) | Unique while active enrollment |
| `plan_id` | CHAR(21) | FK → plans |
| `activated_at` | DATETIME(3) | Billing clock start |
| `status` | ENUM | `active` \| `cancelled` |
| `cancelled_at` | DATETIME(3) | nullable |
| timestamps | | |

One **active** subscription per company for system billing in v1.

### `payment_invoices`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `invoice_number` | VARCHAR | Unique human id — e.g. `SYS-2026-000123` |
| `payment_reference` | VARCHAR(32) | Unique bank transfer narrative — e.g. `WO-2026-000123` |
| `company_id` | CHAR(21) | Copy |
| `subscription_id` | CHAR(21) | FK |
| `kind` | ENUM | `system_subscription` (v1 only) |
| `status` | ENUM | `issued` \| `paid` \| `overdue` \| `void` |
| `currency` | CHAR(3) | `LKR` |
| `amount_minor` | BIGINT | Sum of lines (300000 for standard month) |
| `period_start` | DATETIME(3) | Inclusive |
| `period_end` | DATETIME(3) | Exclusive |
| `issued_at` | DATETIME(3) | |
| `due_at` | DATETIME(3) | `period_end` + `INVOICE_DUE_DAYS` |
| `paid_at` | DATETIME(3) | nullable |
| `voided_at` | DATETIME(3) | nullable |
| `notes` | TEXT | nullable |
| timestamps | | |

**Unique constraint:** `(company_id, kind, period_start)` — idempotent generation.

### `payment_invoice_lines`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `invoice_id` | CHAR(21) | FK |
| `description` | VARCHAR | e.g. `Platform subscription — Mar 2026` |
| `quantity` | INT | `1` |
| `unit_amount_minor` | BIGINT | `300000` |
| `amount_minor` | BIGINT | quantity × unit |

## Activation sync (from WebOnOne)

When a company is **approved** in WebOnOne (`status = approved`, `approved_at` set):

```text
WebOnOne BE ──POST /api/v1/internal/companies/upsert──► Payment BE
```

Body:

```json
{
  "companyId": "…",
  "name": "Acme (Pvt) Ltd",
  "activatedAt": "2026-03-15T10:22:00.000Z",
  "status": "active"
}
```

Payment service:

1. Upsert `payment_companies` (`activated_at`, `name`, `status`).
2. Ensure an **active** `payment_subscriptions` row for `platform_monthly` with `activated_at`.
3. Optionally enqueue immediate **backfill** of invoices from `activated_at` through current period.

When status moves to **rejected** / inactive:

```json
{ "companyId": "…", "status": "inactive" }
```

→ set company inactive; cancel subscription (`cancelled`); **do not** delete historical invoices.

Auth: `X-Payment-Service-Key: {PAYMENT_SERVICE_API_KEY}`.

## Period calculation

Timezone: `BILLING_TIMEZONE` (default `Asia/Colombo`).

Given `activated_at` local date `D0`:

| Period index `n` (0-based) | `period_start` | `period_end` |
|----------------------------|----------------|--------------|
| 0 | `D0` 00:00:00 | `addMonths(D0, 1)` |
| 1 | `addMonths(D0, 1)` | `addMonths(D0, 2)` |
| … | … | … |

`addMonths` uses calendar month arithmetic; if the day does not exist (e.g. Jan 31 → Feb), clamp to last day of month.

**Amount:** always full plan amount in 1.16.0 (no proration).

## Invoice generator worker

`payment/backend/src/workers/invoiceGenerator.ts`:

1. Load all `payment_subscriptions` where `status = active`.
2. For each subscription, compute periods from `activated_at` up to and including the period that contains **now**.
3. For each missing `(company_id, period_start)`, insert invoice + line atomically.
4. Mark existing `issued` invoices **overdue** when `now > due_at` and still unpaid.
5. Run on interval `INVOICE_GENERATOR_INTERVAL_MS`; also expose internal `POST /api/v1/internal/invoices/generate` for ops/backfill.

Idempotency: unique key + `INSERT IGNORE` / catch duplicate — never double-bill a period.

## Public API (JWT)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/invoices` | super_admin (all); company_admin (own) | Paginated list; filters: `status`, `companyId`, `from`, `to`, `q` (company name / invoice # / payment reference) |
| `GET` | `/api/v1/invoices/by-reference/:reference` | super_admin; company_admin if own | Lookup by bank transfer `payment_reference` (case-insensitive) |
| `POST` | `/api/v1/invoices/mark-paid-by-reference` | super_admin | `{ paymentReference, paidAt? }` → mark matching invoice paid |
| `GET` | `/api/v1/invoices/:id` | super_admin; company_admin if own | Detail + lines + company summary |
| `POST` | `/api/v1/invoices/:id/mark-paid` | super_admin | `{ paidAt? }` → status `paid` |
| `POST` | `/api/v1/invoices/:id/void` | super_admin | `{ reason? }` → status `void` |
| `GET` | `/api/v1/dashboard/summary` | super_admin | Counts: issued / paid / overdue; sum outstanding |

List DTO (row):

```typescript
{
  id: string
  invoiceNumber: string
  paymentReference: string
  companyId: string
  companyName: string
  kind: 'system_subscription'
  status: 'issued' | 'paid' | 'overdue' | 'void'
  currency: 'LKR'
  amountMinor: number
  periodStart: string
  periodEnd: string
  issuedAt: string
  dueAt: string
  paidAt: string | null
}
```

## Internal API (service key)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/internal/companies/upsert` | Activation / deactivate sync |
| `POST` | `/api/v1/internal/invoices/generate` | Run generator once (optional `companyId`) |

## Seed

Migration or seed script:

- Plan `platform_monthly` — LKR 3,000 / month, active.
- Optional demo companies **not** required; prefer real sync from WebOnOne.

## Display

- UI shows **Rs 3,000.00** (or `LKR 3,000.00`) using minor→major formatting.
- Invoice number sequential per year or global sequence table — document choice in implementation (recommend yearly sequence `SYS-YYYY-######`).

## Acceptance (subtask 2)

- [ ] Plan seeded at LKR 3,000 / month
- [ ] Company upsert creates active subscription with `activated_at`
- [ ] Generator creates one invoice per period without duplicates
- [ ] Deactivate stops new invoices; history retained
- [ ] List/detail/mark-paid/void APIs enforce roles
- [ ] Overdue transition works after `due_at`
