# 05 — WebOnOne `users_roles` table

Consolidate platform and company user permissions into a single **`users_roles`** table in the WebOnOne core schema. Replace **`super_admins`** and **`company_memberships`** with one role model linked to Identity `user_id` copies.

## Background (1.6.0)

Spec [1.6.0](../1.6.0/02-company-service.md) introduced:

- `super_admins` — platform operators identified by email
- `company_memberships` — one row per user with `member` or `company_admin` (unique `user_id`)

That model does not support multiple company memberships or multiple roles per company.

## Goals

1. **`users_roles` table** — canonical permission store in `webonone_v2`.
2. **Identity link** — every row stores Identity `user_id` (CHAR(21) copy; no cross-DB FK).
3. **Role types** — `super_admin`, `company_admin`, `member`.
4. **Multi-company / multi-role** — a user may hold several rows (different companies and/or roles).
5. **Remove legacy tables** — drop `super_admins` and `company_memberships` after data migration.
6. **Refactor backend** — repository, service, middleware, seed, and company approval flows use `users_roles`.

## Schema

### `users_roles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `user_id` | CHAR(21) | Identity user copy — required |
| `role` | ENUM | `super_admin`, `company_admin`, `member` |
| `company_id` | CHAR(21) NULL | FK → `companies.id` ON DELETE CASCADE; **NULL** for `super_admin` |
| `created_at` | TIMESTAMP(3) | |
| `updated_at` | TIMESTAMP(3) | |

**Constraints:**

- `super_admin` rows must have `company_id IS NULL`.
- Company-scoped roles (`company_admin`, `member`) must have `company_id NOT NULL`.
- Unique index on `(user_id, company_id, role)` — allows multiple roles per company; `company_id` NULL treated as distinct per MySQL unique semantics (one super_admin row per user).
- Index on `user_id`, index on `company_id`.

### `companies` column change

| Column | Change |
|--------|--------|
| `approved_by_super_admin_id` | Rename to **`approved_by_user_id`** (CHAR(21) NULL) — Identity user who approved; no FK to removed `super_admins` |

## Data migration

1. Create `users_roles`.
2. Insert from `company_memberships`: map `user_id`, `company_id`, `role`.
3. Insert `super_admin` rows: for each `super_admins` row, insert role with `user_id` from env **`SUPER_ADMIN_USER_ID`** when set; otherwise skip (dev re-seed).
4. Copy `approved_by_super_admin_id` → `approved_by_user_id` where resolvable via super-admin email + env user id, else NULL.
5. Drop FK from `companies` to `super_admins`; drop `company_memberships`; drop `super_admins`.

## Backend refactor

| Area | Change |
|------|--------|
| `userRole.repository.ts` | CRUD/query helpers for `users_roles` |
| `company.repository.ts` | Remove membership/super-admin table access; company CRUD only |
| `company.service.ts` | Role assignment via `users_roles`; `getMyCompany` picks primary company membership |
| `requireSuperAdmin.ts` | Check `users_roles` for `role = super_admin` and JWT `sub` |
| `seedSuperAdmin.ts` | Upsert `super_admin` row for `SUPER_ADMIN_USER_ID` from env |
| `env.ts` | Add `SUPER_ADMIN_USER_ID` (CHAR(21)); keep email/display name for docs |

### API behaviour (unchanged externally)

- `GET /company/admin/me` — returns profile when caller has `super_admin` role.
- `GET /company/me` — returns company + membership role for caller's **first** company membership (same as today until multi-company UI exists).
- Company registration — insert `member` role row instead of membership.
- Approve/reject — promote/demote `company_admin` / `member` on creator's role row.

### `getMyCompany` selection rule

When a user has multiple company role rows, return the row with `company_admin` if any; else earliest `created_at`. Document in service — full multi-company picker is out of scope.

## Environment

| Variable | Layer | Purpose |
|----------|-------|---------|
| `SUPER_ADMIN_USER_ID` | backend `.env` | Identity `user_id` for seeded super admin |
| `SUPER_ADMIN_EMAIL` | backend `.env` | Documentation / email sync only |
| `SUPER_ADMIN_DISPLAY_NAME` | backend `.env` | Display name for admin profile response |

## Out of scope

- Identity DB changes.
- UI for assigning multiple companies or roles (future; `UserSelectionDialog` may consume list API later).
- Email service schema changes beyond existing `syncUserRole` calls.

## ClickUp source

Subtask **need to have the user role table** (86ey40ya9).
