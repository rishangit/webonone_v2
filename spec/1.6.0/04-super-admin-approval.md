# 04 — Super Admin Approval

Interim **super admin** flow for approving pending company registrations. Credentials live in the **Company service database** (hashed), not Identity.

## Super admin login

### Option A (recommended for 1.6.0)

**WebOnOne route:** `/admin/companies` (or `/settings/super-admin`)

- Separate login form: email + password → `POST` Company `/auth/super-admin/login`
- Store super-admin token in session storage (not Redux auth slice used for Identity JWT)
- Guard route: only accessible when super-admin token present

### Option B

Company standalone FE (`company/frontend`) hosts super-admin pages. WebOnOne links out for approval. Use only if WebOnOne scope must stay minimal.

**Spec default:** Option A in WebOnOne for fewer deployables in 1.6.0.

## Pending companies list

**Page:** `PendingCompaniesPage.tsx` (super-admin only)

| Column | Source |
|--------|--------|
| Company name | `companies.name` |
| Logo | thumbnail from `logo_url` |
| Registrant | `created_by_user_id` (display user id or email if cached) |
| Submitted | `created_at` |
| Action | **Approve** button |

Data: `GET /admin/companies/pending` with super-admin token (proxied via WebOnOne backend optional).

## Approve action

1. Confirm dialog (optional).
2. `POST /admin/companies/:id/approve`
3. Remove row from list or refresh; show success toast.
4. Registrant's next `GET /me/company` shows `approved` and role `company_admin`.

## WebOnOne backend proxy

| Method | Path | Action |
|--------|------|--------|
| `POST` | `/api/v1/company/super-admin/login` | Forward to Company auth |
| `GET` | `/api/v1/company/admin/pending` | Forward with super-admin token |
| `POST` | `/api/v1/company/admin/:id/approve` | Forward with super-admin token |

Middleware: `requireSuperAdminSession` on admin proxy routes — validate Company-issued super-admin token.

## Seed credentials (interim)

Document in `company/backend/.env.example`:

```env
SUPER_ADMIN_EMAIL=superadmin@webonone.local
SUPER_ADMIN_PASSWORD=change-me-in-local-env
```

Knex seed or migration reads env at `npm run migrate` / `npm run seed` in dev. **Never commit real passwords.**

Future spec: promote Identity user to super admin via admin UI (called out in ClickUp subtask as deferred).

## Security

- Super-admin token separate audience/claim from Identity JWT.
- Do not expose super-admin login on public marketing pages; route is unlisted.
- Rate-limit login endpoint.
- Approve endpoint idempotent; audit `approved_by_super_admin_id` and `approved_at`.

## Acceptance mapping (subtask 86ey2p61f)

| Criterion | Implementation |
|-----------|----------------|
| Super admin with hard-coded credentials | Seed in Company DB |
| List of pending companies | Pending companies page |
| Approve → user role `admin` | API sets `company_admin` on membership |
| Credentials not in Identity | `super_admins` table in `webonone_company` |
