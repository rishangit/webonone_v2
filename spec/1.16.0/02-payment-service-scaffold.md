# 02 — Payment service scaffold (1.16.0)

Service layout, ports, authentication, roles, navigation, and DB ownership. Mirrors the [SMS](../1.12.0/02-sms-service-scaffold.md) / [Email](../../email/) standalone structure. Implements ClickUp subtask **TBD**.

## Service folder layout

Clone the Email/SMS standalone structure:

```text
payment/
  package.json              # payment-root — dev, build, migrate
  frontend/
    .env.example            # VITE_API_BASE_URL, VITE_IDENTITY_*, VITE_ALLOWED_PARENT_ORIGINS, VITE_WEBONONE_ORIGIN
    src/
      app/                  # AppLayout, router, store, LazyRoute
      features/
        auth/               # callback, JWT storage, identityConfig, bootstrapPlatformSession
        shell/              # navItems.ts, coreNavItems.ts, buildAppNav
        dashboard/
        invoices/           # list + detail (see 04)
  backend/
    .env.example            # DB_*, PORT, JWT_SECRET, PAYMENT_SERVICE_API_KEY, BILLING_*
    migrations/
    src/
      config/{env.ts, knex.ts}
      middleware/{auth.ts, internalAuth.ts, validateBody.ts, errorHandler.ts, requireRole.ts}
      routes/
      controllers/
      services/
      models/db.ts
      workers/invoiceGenerator.ts
  deploy/                   # IIS stub (optional for 1.16.0)
```

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | **3017** | `payment/frontend/.env` |
| Backend | **4017** | `payment/backend/.env` |

| Variable | Layer | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | BE | Verify Identity-issued JWT (duplicate value from Identity BE) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | BE | MySQL `webonone_payment` |
| `PORT` | BE | `4017` |
| `PAYMENT_SERVICE_API_KEY` | BE | Internal API auth (shared with WebOnOne BE) |
| `SYSTEM_MONTHLY_AMOUNT_LKR` | BE | Default `3000` (seed/plan amount) |
| `BILLING_TIMEZONE` | BE | Default `Asia/Colombo` |
| `INVOICE_GENERATOR_INTERVAL_MS` | BE | Worker poll interval (e.g. `3600000` = 1h) |
| `INVOICE_DUE_DAYS` | BE | Days after `period_end` until `due_at` (default `14`) |
| `VITE_IDENTITY_ORIGIN` | FE | Login redirect |
| `VITE_IDENTITY_API_BASE_URL` | FE | Auth code exchange |
| `VITE_API_BASE_URL` | FE | Payment API |
| `VITE_WEBONONE_ORIGIN` | FE | Return link when opened from core |
| `VITE_ALLOWED_PARENT_ORIGINS` | FE | postMessage allowlist if embedded |

Use **placeholder** secrets only in `.env.example` (do not commit real credentials).

## Root workspace wiring

Add to root `package.json`:

- Workspaces: `payment`, `payment/frontend`, `payment/backend`.
- Scripts: `dev:payment`, `install:payment`, `build:payment` (chain shared package builds first, matching Email/SMS), `migrate:payment`, `deploy:payment`.
- Append `dev:payment` to the root `dev` concurrently command.

## Package build chain

Payment frontend imports `@webonone/ui-kit`, `@webonone/theme`, `@webonone/platform-nav`, `@webonone/platform-embed`, `@webonone/store-kit` as needed.

| Step | Location |
|------|----------|
| Root | Existing `build:platform-nav`, `build:platform-embed`, `build:theme`, `build:store-kit`, `build:ui-kit` |
| `payment/package.json` `build` | Chain those builds **before** FE/BE workspace builds |
| `payment/frontend/vite.config.ts` | Aliases to package `src/` for dev |

## Authentication

1. Unauthenticated admin users → redirect to Identity `/login?redirect_uri={paymentCallback}` (auth-code / platform handoff same as Email/SMS).
2. `/callback` exchanges auth code for JWT.
3. Payment BE verifies `Authorization: Bearer` locally on all public routes except `/health` and internal routes (`X-Payment-Service-Key`).
4. JWT claims used: `sub`, `email`, `platform_role`, `company_id`. Prefer JWT claims for role (mirror Email/SMS); no shared role DB with Identity.

## Roles and authorization

| Role | Access in 1.16.0 |
|------|------------------|
| **Super admin** | Dashboard; **Invoices** list (all companies); invoice detail; mark paid / void |
| **Company admin** | Optional read-only: own company's invoices only (if exposed in nav); no mark paid/void |
| **Member** | No Payment admin access (or dashboard empty state) |

- `requireRole(...)` gates mutating invoice routes to `super_admin`.
- List filters: super admin may omit `companyId`; company admin forced to JWT `company_id`.

## Left navigation (Payment standalone)

`payment/frontend/src/features/shell/config/navItems.ts`:

| Label | Path | Roles |
|-------|------|-------|
| Dashboard | `/` | super_admin, company_admin |
| Invoices | `/invoices` | super_admin (all); company_admin (own, if enabled) |

Use `@webonone/ui-kit` `AppShell` + role-filtered nav. Follow the platform shell three-layer pattern ([platform-shell-navigation.mdc](../../.cursor/rules/platform-shell-navigation.mdc)).

## WebOnOne menu entry

Add a **Payment** group to **super-admin** platform nav (Invoices leaf) via `packages/platform-nav` + WebOnOne redirect handoff (`VITE_PAYMENT_ORIGIN`, derive paths in `webonone-v2/frontend/src/features/payment/utils/paymentConfig.ts`). WebOnOne does **not** host invoice pages — link/redirect (or iframe embed) only, same as Email/SMS.

Company-admin Payment nav is **optional** in 1.16.0 (own invoices); if omitted, document as follow-up.

## Database ownership

Payment DB **`webonone_payment`** — no cross-service SQL. Foreign keys are **copies** only (`user_id` CHAR(21), `company_id` CHAR(21)).

### Base migration (scaffold)

| Table | Purpose |
|-------|---------|
| `payment_users` | Optional mirror of user id/email for display |
| `payment_companies` | Local company copy: `id`, `name`, `activated_at`, `status` (`active` \| `inactive`), timestamps |
| `payment_plans` | Seeded `platform_monthly` — amount_cents `300000` (LKR 3000.00), currency `LKR`, interval `month` |
| `payment_audit_log` | Activation sync, invoice issue, status changes |

Domain tables for subscriptions and invoices are defined in [03-system-billing-and-invoices.md](./03-system-billing-and-invoices.md).

Store money as **integer cents** (or minor units): LKR 3000.00 → `300000` if using cents with 2 decimal places. Document column as `amount_minor` BIGINT + `currency` CHAR(3).

## Health and standalone

- `GET /health` → `{ status: 'ok', service: 'payment' }`
- `npm run dev -w payment-root` starts FE + BE without Identity/WebOnOne running (auth redirect degrades gracefully).

## Agent / skill (repo follow-up)

Add `payment-agent` + `.cursor/skills/payment-agent/SKILL.md` (copy from `sms-agent` / `data-agent`) and register in `AGENTS.md` when implementing. Spec alone does not require the agent files, but Phase 1 should add them.

## Acceptance (subtask 1)

- [ ] `payment/` scaffold matches Email/SMS layout conventions
- [ ] JWT auth + `requireRole` enforced
- [ ] Nav shows role-appropriate items
- [ ] Own DB `webonone_payment`; no shared tables with WebOnOne
- [ ] `dev:payment` serves login shell and `/health`
- [ ] Root workspace wiring for `payment/`
- [ ] `.env.example` files committed for FE and BE
