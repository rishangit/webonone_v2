# 02 — SMS service scaffold (1.12.0)

Service layout, ports, authentication, roles, device scope, navigation, and DB ownership. Mirrors the [Email service](../../email/) structure. Implements ClickUp subtask **TBD**.

## Service folder layout

Clone the [Email](../../email/) standalone structure:

```text
sms/
  package.json              # sms-root — dev, build, migrate
  frontend/
    .env.example            # VITE_API_BASE_URL, VITE_IDENTITY_*, VITE_ALLOWED_PARENT_ORIGINS
    src/
      app/                  # AppLayout, router, store
      features/
        auth/               # callback, JWT storage, identityConfig
        shell/              # navItems.ts, coreNavItems.ts
        dashboard/
        devices/            # approve / revoke / status
        queue/
        history/
        templates/
        send/               # manual + test send
  backend/
    .env.example            # DB_*, PORT, JWT_SECRET, SMS_SERVICE_API_KEY, OTP_TTL_SECONDS, QUEUE_WORKER_INTERVAL_MS
    migrations/
    src/
      config/{env.ts, knex.ts}
      middleware/{auth.ts, internalAuth.ts, deviceAuth.ts, validateBody.ts, errorHandler.ts}
      routes/
      controllers/
      services/
      models/db.ts
      workers/reaper.ts
  deploy/                   # IIS stub (optional for 1.12.0)
```

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | **3016** | `sms/frontend/.env` |
| Backend | **4016** | `sms/backend/.env` |

| Variable | Layer | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | BE | Verify Identity-issued JWT (duplicate value from Identity BE) |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | BE | MySQL `webonone_sms` |
| `PORT` | BE | `4016` |
| `SMS_SERVICE_API_KEY` | BE | Internal send / OTP auth (shared with Identity/WebOnOne) |
| `OTP_TTL_SECONDS` | BE | OTP lifetime (default 300) |
| `DEVICE_STALE_MS` | BE | Mark device offline after no heartbeat |
| `PROCESSING_TIMEOUT_MS` | BE | Revert stuck `processing` rows to `pending` |
| `QUEUE_WORKER_INTERVAL_MS` | BE | Reaper interval (default 5000) |
| `VITE_IDENTITY_ORIGIN` | FE | Login redirect |
| `VITE_IDENTITY_API_BASE_URL` | FE | Auth code exchange |
| `VITE_API_BASE_URL` | FE | SMS API |
| `VITE_WEBONONE_ORIGIN` | FE | Optional return link when opened from core |

Use **placeholder** secrets only in `.env.example` (do not commit real credentials).

## Root workspace wiring

Add to root `package.json`:

- Workspaces: `sms`, `sms/frontend`, `sms/backend`, and `mobile`.
- Scripts: `dev:sms`, `install:sms`, `build:sms` (chain shared package builds first, matching `email`), `migrate:sms`, `deploy:sms`.
- Append `dev:sms` to the root `dev` concurrently command.
- Add `mobile`, `mobile:android`, `mobile:web` scripts — but **not** to the root `dev` chain (Metro is interactive; see [04-mobile-app.md](./04-mobile-app.md)).

## Authentication

1. Unauthenticated admin users → redirect to Identity `/login?redirect_uri={smsCallback}`.
2. `/callback` exchanges auth code for JWT (same pattern as Email/Media).
3. SMS BE verifies `Authorization: Bearer` locally on all public routes except `/health`, internal routes (`X-Sms-Service-Key`), and device routes (`X-Sms-Device-Key`).
4. JWT claims used: `sub` (user id), `email`, `platform_role`, `company_id`. No local role table — mirror Email.

## Roles, device scope, and authorization

| Role | Admin nav / API access | Device scope on register |
|------|------------------------|--------------------------|
| **Super admin** | All: Dashboard, Devices (all), Queue, History, Templates, Send, Test | `platform` (system SMS) |
| **Company admin** | Dashboard, Devices (own company), Queue/History (company), Templates (company overrides), Send/Test (company) | `company` (their company) |
| **Member** | Dashboard read-only summary | Cannot register a gateway |

- `requireRole(...)` middleware gates admin routes.
- Device `scope` is derived server-side from the registrant's JWT role — never client-supplied.
- Company admins can only see/approve/revoke devices and messages for their own `company_id`.

## Left navigation

`sms/frontend/src/features/shell/config/navItems.ts`:

| Label | Path | Roles |
|-------|------|-------|
| Dashboard | `/` | all authenticated |
| Devices | `/devices` | super_admin (all), company_admin (own) |
| Send | `/send` | super_admin, company_admin |
| Templates | `/templates` | super_admin, company_admin |
| Queue | `/queue` | super_admin, company_admin |
| History | `/history` | super_admin, company_admin |
| Test | `/test` | super_admin, company_admin |

Use `@webonone/ui-kit` `AppShell` + role-filtered nav. Follow the platform shell three-layer pattern like Email (`email-project.mdc`).

## WebOnOne menu entry (optional)

Add an **SMS** item to core platform nav via the same redirect handoff Email uses (`VITE_SMS_ORIGIN`, derive paths in `webonone-v2/frontend/src/features/sms/utils/smsConfig.ts`). WebOnOne does not host SMS pages — link/redirect only.

## Database ownership

SMS DB **`webonone_sms`** — no cross-service SQL. Foreign keys are **copies** only (`user_id` CHAR(21), `company_id` CHAR(21)).

Initial migration creates `sms_users`, `sms_companies`. Domain tables (`sms_devices`, `sms_templates`, `sms_template_versions`, `sms_queue`, `sms_history`, `sms_otps`, `sms_audit_log`) are defined in [03-gateway-and-sending-engine.md](./03-gateway-and-sending-engine.md).

## Health and standalone

- `GET /health` → `{ status: 'ok', service: 'sms' }`
- `npm run dev -w sms-root` starts FE + BE without Identity/WebOnOne running (auth redirect degrades gracefully).

## Acceptance (subtask 1)

- [ ] `sms/` scaffold matches Email layout conventions
- [ ] JWT auth + `requireRole` enforced; device scope derived from role
- [ ] Nav shows role-appropriate items
- [ ] Own DB `webonone_sms`; no shared tables
- [ ] `dev:sms` serves login shell and `/health`
- [ ] Root workspace wiring for `sms/` and `mobile/`
