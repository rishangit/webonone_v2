# 02 — Company Backend (WebOnOne v2)

Company registration, memberships, platform roles, and super-admin approval are implemented **inside WebOnOne v2** — not as a separate microservice. Backend code lives under `webonone-v2/backend/src/`; tables live in the **WebOnOne core MySQL schema `webonone_v2`**.

## Layout

```text
webonone-v2/
  backend/
    migrations/                # companies, company_memberships, super_admins
    src/
      routes/company.routes.ts
      controllers/company.controller.ts
      services/company.service.ts
      repositories/company.repository.ts
      middleware/requireSuperAdmin.ts
      db/seedSuperAdmin.ts
  frontend/
    src/features/settings/basic/   # registration wizard, company section, super-admin UI
```

## Responsibilities

- Store **companies** (name, optional logo URL, status, wizard fields).
- Store **company memberships** linking Identity `user_id` to company + **platform role**.
- Authenticate **super admin** with local credentials (hashed password in `webonone_v2` — **not** Identity).
- Verify **Identity JWT** on user-facing routes (`sub` → `user_id`).
- Expose REST API under `/api/v1/company/*`.

## Database schema (1.6.0)

### `companies`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `name` | VARCHAR(255) | Display name |
| `description` | TEXT NULL | Company description (wizard step 1) |
| `company_size` | VARCHAR(32) NULL | Size band e.g. `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| `logo_url` | VARCHAR(2048) NULL | Optional Media public URL; upload deferred in 1.6.0 |
| `address_line1` | VARCHAR(255) NULL | Street address |
| `address_line2` | VARCHAR(255) NULL | Suite / unit |
| `city` | VARCHAR(128) NULL | City |
| `state_region` | VARCHAR(128) NULL | State or region |
| `postal_code` | VARCHAR(32) NULL | Postal / ZIP |
| `country` | VARCHAR(128) NULL | Country |
| `contact_email` | VARCHAR(255) NULL | Public contact email |
| `contact_phone` | VARCHAR(64) NULL | Public contact phone |
| `status` | ENUM | `pending`, `approved`, `rejected` |
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
| `user_id` | CHAR(21) | Identity user copy — no FK to Identity DB |
| `role` | ENUM | `member`, `company_admin` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Constraint (1.6.0):** One company per user — unique index on `user_id` in `company_memberships`.

### `super_admins`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `email` | VARCHAR(255) UNIQUE | Must match Identity login email |
| `password_hash` | VARCHAR(255) NULL | Deprecated — auth via Identity JWT |
| `display_name` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | |

**Seed:** Insert one super admin email from env via `npm run seed -w @webonone/webonone-backend`. Create matching Identity user in local dev.

## Platform roles

| Role | Who | Capabilities (1.6.0) |
|------|-----|----------------------|
| `member` | Default before approval / non-admin members | View own membership; register company if none |
| `company_admin` | User who registered, after approval | View company details (read-only in 1.6.0) |
| `super_admin` | Seeded email in `super_admins` | List all companies; set status approve / reject / pending |

Super admin auth uses the **Identity JWT** on admin routes; `requireSuperAdmin` verifies JWT and checks `super_admins.email`.

## API (`/api/v1/company`)

All user routes: `Authorization: Bearer <Identity JWT>` unless noted.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/company/me` | Identity JWT | Current user's company + membership + role; 404 if none |
| `POST` | `/company/register` | Identity JWT | Register company → status `pending`; membership as `member` until approval |
| `GET` | `/company/admin/me` | Identity JWT | Super-admin profile if email allowlisted; 404 otherwise |
| `GET` | `/company/admin/companies` | Super admin | All companies |
| `PATCH` | `/company/admin/:id/status` | Super admin | Body `{ status }` — `pending`, `approved`, or `rejected` |
| `POST` | `/company/admin/:id/approve` | Super admin | Approve shortcut |

### Register company rules

- User must not already have a membership (409 if exists).
- `name` required; `logoUrl` **optional**; wizard fields validated (see [03](./03-webonone-company-ui.md)).
- On create: `companies.status = pending`, `company_memberships.role = member`.

### Status rules

- **Approved:** sets `company_admin` on registrant; records `approved_at` and `approved_by_super_admin_id`.
- **Rejected / pending:** demotes registrant to `member`; clears approval audit fields.

## Environment (`webonone-v2/backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `DB_*` | MySQL connection to `webonone_v2` |
| `PORT` | `4000` |
| `JWT_SECRET` | Same value as Identity for verifying user JWT |
| `SUPER_ADMIN_EMAIL` | Seed only — must match Identity account email |
| `SUPER_ADMIN_DISPLAY_NAME` | Seed display name |

## Security

- Identity JWT: verify signature, `iss`, `aud`, `exp` locally (`requireAuth`).
- Super-admin routes: Identity JWT + `super_admins.email` lookup via `requireSuperAdmin`.
- No passwords or tokens in URLs.
- `user_id` is a copy from JWT `sub` — no query to Identity DB.
