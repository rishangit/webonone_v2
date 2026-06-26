# 02 — Company Service

New standalone microservice: **`company/`** — frontend, backend, MySQL database **`webonone_company`**.

Production host (future): **`company.webonone.com`**. Local dev: FE **`:3004`**, BE **`:4004`**.

## Responsibilities

- Store **companies** (name, logo URL, status).
- Store **company memberships** linking Identity `user_id` to company + **platform role**.
- Authenticate **super admin** with local credentials (hashed password in Company DB — **not** Identity).
- Verify **Identity JWT** on user-facing routes (`sub` → `user_id`).
- Expose REST API for registration, membership read, pending list, and approval.

## Database schema (1.6.0)

### `companies`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `name` | VARCHAR(255) | Display name |
| `logo_url` | VARCHAR(2048) NULL | Media public URL |
| `status` | ENUM | `pending`, `approved` |
| `created_by_user_id` | CHAR(21) | Identity user who registered |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `approved_at` | TIMESTAMP NULL | Set on approval |
| `approved_by_super_admin_id` | CHAR(21) NULL | FK to super_admins |

### `company_memberships`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `company_id` | CHAR(21) | FK companies |
| `user_id` | CHAR(21) | Identity user copy — no cross-DB FK |
| `role` | ENUM | `member`, `company_admin` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Constraint (1.6.0):** One company per user — unique index on `user_id` in `company_memberships`.

### `super_admins`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `email` | VARCHAR(255) UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | bcrypt (or same hasher as Identity) |
| `display_name` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | |

**Seed migration:** Insert one super admin from env (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`) at migration time or via knex seed script documented in `backend/.env.example`. Password never committed to repo.

## Platform roles

| Role | Who | Capabilities (1.6.0) |
|------|-----|----------------------|
| `member` | Default before approval / non-admin members | View own membership; register company if none |
| `company_admin` | User who registered, after approval | View/edit company details (name, logo) — edit scope in 1.6.0: view + logo update optional |
| `super_admin` | Seeded account | List pending companies; approve |

Super admin auth is **separate** from Identity JWT — dedicated login endpoint returns a Company-issued session token (JWT or opaque session) scoped to super-admin routes only. Do not store super-admin password in Identity.

## API (`/api/v1`)

All user routes: `Authorization: Bearer <Identity JWT>` unless noted.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Liveness |
| `POST` | `/auth/super-admin/login` | None | Body: `{ email, password }` → super-admin token |
| `GET` | `/me/company` | Identity JWT | Current user's company + membership + role; 404 if none |
| `POST` | `/companies` | Identity JWT | Register company: `{ name, logoUrl }` → status `pending`; creates membership as `member` until approval sets `company_admin` |
| `GET` | `/admin/companies/pending` | Super-admin token | List pending companies with registrant `user_id` |
| `POST` | `/admin/companies/:id/approve` | Super-admin token | Approve → `approved`, registrant role → `company_admin` |

### Register company rules

- User must not already have a membership (409 if exists).
- `name` required; `logoUrl` optional but UI requires logo per acceptance criteria.
- On create: `companies.status = pending`, `company_memberships.role = member` (promoted on approval).

### Approval rules

- Only `pending` companies can be approved.
- Sets `company_admin` on `created_by_user_id` membership.
- Idempotent: re-approve approved company → 200 no-op or 409 per API style.

## Backend layout

```text
company/
  frontend/                    # port 3004 — optional standalone admin UI
  backend/                     # port 4004
    src/
      config/env.ts
      middleware/
        requireIdentityJwt.ts
        requireSuperAdmin.ts
      routes/
        health.ts
        companies.ts
        admin.ts
        auth.ts
      services/
        companyService.ts
        superAdminAuthService.ts
      repositories/
  migrations/
  package.json
```

## Environment (`backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL `webonone_company` |
| `PORT` | `4004` |
| `JWT_SECRET` | Same value as Identity/WebOnOne for verifying user JWT |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Match Identity claims |
| `SUPER_ADMIN_JWT_SECRET` | Sign super-admin session tokens (may equal `JWT_SECRET` with different `aud`) |
| `SUPER_ADMIN_EMAIL` | Seed only — local dev |
| `SUPER_ADMIN_PASSWORD` | Seed only — local dev |

## Folder layout (service root)

```text
company/
  frontend/
  backend/
  migrations/
  package.json                 # dev: concurrently FE + BE
```

Register in root `package.json`: workspace, `dev:company`, append to root `npm run dev`.

## Security

- Identity JWT: verify signature, `iss`, `aud`, `exp` locally.
- Super-admin routes: separate token; never accept Identity JWT for `/admin/*`.
- No passwords or tokens in URLs.
- `user_id` is a copy from JWT `sub` — no query to Identity DB.
