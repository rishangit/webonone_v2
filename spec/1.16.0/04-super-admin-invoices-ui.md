# 04 — Super-admin invoices UI (1.16.0)

Payment frontend **Invoices** list (all companies) and invoice detail, plus WebOnOne / platform-nav entry for super admins. Implements ClickUp subtask **TBD**.

## User story

As a **super admin**, after I log into WebOnOne and open Payment, I want to see a list of **all companies' system invoices** (company, period, amount, status), and open any invoice for detail / mark paid / void.

## Payment FE — Invoices list

**Route:** `/invoices`  
**Page:** `InvoicesPage` under `payment/frontend/src/features/invoices/`  
**Layout:** `@webonone/ui-kit` `FeaturePage` + `ListPageBody` + ItemList (glass-card rows, 3-dot menu) — follow [item-list skill](../../.cursor/skills/item-list/SKILL.md).

### Filters / toolbar

| Control | Behavior |
|---------|----------|
| Search | Company name / invoice number (`q`) |
| Status | All \| Issued \| Paid \| Overdue \| Void |
| Date range | Optional filter on `period_start` or `issued_at` |
| Company | Optional company filter (super admin) |

Pagination via existing UI Kit / store-kit patterns (`createPaginatedFeatureStore` or list epic).

### Row columns

| Column | Source |
|--------|--------|
| Invoice # | `invoiceNumber` |
| Company | `companyName` |
| Period | `periodStart` – `periodEnd` (formatted local date) |
| Amount | `amountMinor` → **Rs 3,000.00** |
| Status | Status tag (`issued` / `paid` / `overdue` / `void`) |
| Due | `dueAt` |
| Actions | 3-dot: **View**, **Mark paid** (if issued/overdue), **Void** (if not paid/void) |

Prefer UI Kit `StatusTag` or a small payment-status variant if company status tags do not fit — do **not** hand-roll chips when a kit primitive exists; extend Tags showcase only if a new variant is required.

### Empty / loading

- Unified platform loading overlay ([loading-empty-states.mdc](../../.cursor/rules/loading-empty-states.mdc)).
- Empty state when no invoices yet (“No system invoices yet”).

## Payment FE — Invoice detail

**Route:** `/invoices/:id`  
**Layout:** details-page cards pattern optional; keep simple if one card is enough:

- Header: invoice number + status + company name
- Period, issued, due, paid timestamps
- Line items table
- Amount total
- Actions: Mark paid / Void (super admin) — confirm via peer-dialog / `CustomDialog` rules when embedded

## Dashboard (minimal)

**Route:** `/`  
Summary cards or stats: outstanding count, overdue count, paid this month — from `GET /api/v1/dashboard/summary`. Super admin only for aggregates across companies.

## Role gating

- Super admin: full list + mutations.
- Company admin (optional 1.16.0): if nav enabled, same list UI filtered server-side to own `company_id`; hide Mark paid / Void.
- Guard routes in FE; always enforce on BE.

## WebOnOne + platform-nav

### platform-nav

Extend `ExternalServiceId` with `'payment'`.

Add to `SUPER_ADMIN_PLATFORM_NAV`:

```text
Payment (group)
  └── Invoices  → externalService: payment, externalPath: /invoices
```

Sentinels e.g. `/payment/invoices` → map to Payment `/invoices` (mirror Email/SMS sentinel helpers).

### WebOnOne FE

| File / area | Change |
|-------------|--------|
| `features/payment/utils/paymentConfig.ts` | `VITE_PAYMENT_ORIGIN` → origin + derived paths |
| `redirectToPayment.ts` (or shared external redirect) | Auth-code handoff like Email/SMS |
| `AppLayout` nav click | Wire Payment leaf `onClick` |
| `frontend/.env.example` | `VITE_PAYMENT_ORIGIN=http://localhost:3017` |

Do **not** duplicate the invoices page inside WebOnOne.

### Embed vs redirect

Default for 1.16.0: **auth-code redirect** to Payment standalone (same as Email/SMS admin). Iframe embed of Payment in `#main-content` is allowed if the team already prefers Data-style embed for peers — pick **one** approach and match Email/SMS consistency for this release (prefer redirect/handoff unless platform already embeds SMS).

## Acceptance (subtask 3)

- [ ] Super admin sees Invoices list with all companies' system invoices
- [ ] Filters and pagination work
- [ ] Detail shows lines and LKR amount
- [ ] Mark paid / Void update status and list
- [ ] WebOnOne super-admin nav → Payment → Invoices opens Payment with session
- [ ] Company admin cannot mark paid/void; cannot see other companies' invoices
