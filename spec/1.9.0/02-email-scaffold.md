# 02 — Email service scaffold (1.9.0)

Service layout, authentication, roles, navigation, and WebOnOne entry. Implements ClickUp subtask **86ey38567**.

## Service folder layout

Mirror [Media](../../media/) and [Identity](../../identity/) standalone structure:

```text
email/
  package.json              # email-root — dev, build, migrate
  frontend/
    .env.example            # VITE_API_BASE_URL, VITE_IDENTITY_*, VITE_ALLOWED_PARENT_ORIGINS
    src/
      app/                  # AppLayout, router, store
      features/
        auth/               # callback, JWT storage, identityConfig
        shell/              # navItems.ts
        dashboard/
        send/
        templates/
        history/
        queue/
        test/
        providers/
        settings/
  backend/
    .env.example            # DATABASE_URL, PORT, JWT_SECRET, SMTP_*, EMAIL_SERVICE_API_KEY
    migrations/
    src/
      config/env.ts
      middleware/auth.ts
      middleware/internalAuth.ts
      routes/
      services/
      models/
  deploy/                   # IIS stub (optional for 1.9.0)
```

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | **3004** | `email/frontend/.env` |
| Backend | **4004** | `email/backend/.env` |

| Variable | Layer | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | BE | Verify Identity-issued JWT (duplicate from Identity BE) |
| `DATABASE_URL` | BE | MySQL `webonone_email` |
| `VITE_IDENTITY_ORIGIN` | FE | Login redirect |
| `VITE_IDENTITY_API_BASE_URL` | FE | Auth code exchange |
| `VITE_API_BASE_URL` | FE | Email API |
| `EMAIL_SERVICE_API_KEY` | BE | Internal send auth |
| `VITE_WEBONONE_ORIGIN` | FE | Optional return link when opened from core |

Reference: `media/frontend/src/features/auth/utils/identityConfig.ts`, `microservice-architecture.mdc`.

## Root workspace wiring

Add to root `package.json`:

- Workspaces: `email`, `email/frontend`, `email/backend`
- Scripts: `dev:email`, `install:email`, `build:email`
- Append `dev:email` to root `dev` concurrently command

## Authentication

1. Unauthenticated users → redirect to Identity `/login?redirect_uri={emailCallback}`.
2. `/callback` exchanges auth code for JWT (same pattern as Media/WebOnOne).
3. Email BE verifies `Authorization: Bearer` on all public routes except `/health` and internal routes.
4. JWT claims used: `sub` (user id), `email`, platform role flags as needed — extend with custom claims or local role copy table synced on first login.

## Roles and authorization

| Role | Nav / API access |
|------|------------------|
| **Super admin** | All items: Dashboard, Send, Templates, History, Queue, Test, Providers, Settings |
| **Company admin** | Dashboard, Send (company scope), Templates (company overrides), History/Queue (company), Test, Settings (branding only) |
| **Member** | Dashboard (read-only summary) — no send/template/provider access |

Role resolution:

- Store `user_roles` copy in Email DB (`user_id`, `role`: `super_admin` | `company_admin` | `member`, `company_id` nullable).
- Upsert on first authenticated request from JWT + optional sync endpoint from WebOnOne internal API (Phase 4).
- Middleware `requireRole(...roles)` on routes.

## Left navigation

`email/frontend/src/features/shell/config/navItems.ts`:

| Label | Path | Roles |
|-------|------|-------|
| Dashboard | `/` | all authenticated |
| Send Email | `/send` | super_admin, company_admin |
| Templates | `/templates` | super_admin, company_admin |
| History | `/history` | super_admin, company_admin |
| Queue | `/queue` | super_admin, company_admin |
| Test Email | `/test` | super_admin, company_admin |
| Providers | `/providers` | super_admin only |
| Settings | `/settings` | super_admin (global), company_admin (branding tab) |

Use `@webonone/ui-kit` `AppShell` + role-filtered `NavConfigItem[]`.

When user arrives from WebOnOne (`return_url` or `referrer` query), show optional **Back to WebOnOne** header action — do not embed WebOnOne nav inside Email (standalone menu always visible).

## WebOnOne menu entry

Add **Email** to core platform navigation:

- **Option A (preferred):** Extend `packages/platform-nav/src/coreNav.ts` with Email leaf `{ path: '/email', label: 'Email', externalOrigin: true }` resolved to `VITE_EMAIL_ORIGIN` in WebOnOne shell.
- **Option B:** WebOnOne-only nav item linking to `buildPlatformRedirectUrl(emailOrigin, returnPath)`.

WebOnOne does **not** host Email pages — only link/redirect. User JWT/session handoff via Identity auth-code flow when crossing origins.

Add to `webonone-v2/frontend/.env.example`:

```env
VITE_EMAIL_ORIGIN=
VITE_EMAIL_API_BASE_URL=
```

Derive paths in `webonone-v2/frontend/src/features/email/utils/emailConfig.ts`.

## Database ownership

Email DB **`webonone_email`** — no cross-service SQL. Foreign keys are **copies** only (`user_id` CHAR(21), `company_id` CHAR(21)).

Initial migration creates:

- `email_users` — local user_query
- `email_companies`
- `email_user_roles`
- (Additional tables in [03-sending-engine.md](./03-sending-engine.md))

## Health and standalone

- `GET /health` → `{ status: 'ok', service: 'email' }`
- `npm run dev -w email-root` starts FE + BE without Identity/WebOnOne running (auth redirect degrades gracefully)

## Acceptance (subtask 1)

- [ ] `email/` scaffold matches Media layout conventions
- [ ] JWT auth + role middleware enforced
- [ ] Nav shows role-appropriate items
- [ ] WebOnOne menu opens Email origin
- [ ] Direct Email access works with Email nav
- [ ] Own DB; no shared tables with Identity/WebOnOne
