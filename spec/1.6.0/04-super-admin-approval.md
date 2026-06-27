# 04 — Super Admin Approval

Super admin approves and manages company registrations. Super admin signs in through the **same WebOnOne login flow** as regular users (`/login` → Identity) and receives a **role-aware shell** with a **Companies** nav item.

## Super admin login

**WebOnOne route:** `/login` (default — same as all users)

1. User opens `http://localhost:3000/login` (local dev).
2. WebOnOne redirects to Identity embed/login; user authenticates with an Identity account whose **email matches** a row in `super_admins` (seeded via `npm run seed -w @webonone/webonone-backend`).
3. WebOnOne receives Identity JWT on `/callback` and stores it in the normal auth session (Redux + session storage).
4. Backend admin routes verify the **Identity JWT** and confirm the JWT `email` claim matches `super_admins.email`.

**Local dev setup:** Register once in Identity using the seeded email (`SUPER_ADMIN_EMAIL` in `webonone-v2/backend/.env.example`). The `super_admins` table stores the allowlisted email only — no separate super-admin password or token.

**Removed (1.6.0 revision):** Separate `/admin/companies/login` page, `POST /company/super-admin/login`, and session-storage super-admin token.

## Super admin navigation

When the logged-in user's email is in `super_admins`, the left nav shows:

| Item | Route | Notes |
|------|-------|-------|
| **Home** | `/` | Same as default user |
| **Companies** | `/companies` | All registered companies; status management |
| **Settings** | `/settings/basic`, `/settings/system-theme` | Same submenu as default user |

Default users do **not** see **Companies**.

Frontend detects super-admin status via `GET /api/v1/company/admin/me` (Identity JWT).

## Companies list

**Page:** `CompaniesPage.tsx` (super-admin only; guarded by API + nav visibility depends on `GET /api/v1/company/admin/companies`.

| Column | Source |
|--------|--------|
| Company name | `companies.name` |
| Logo | thumbnail from `logo_url` (if set) |
| Status | `pending`, `approved`, or `rejected` |
| Registrant | `created_by_user_id` |
| Submitted | `created_at` |
| Actions | 3-dot menu — **Approve**, **Reject**, **Set pending** |

Uses `@webonone/ui-kit` **ItemList** primitives (glass-card rows, overflow menu per row).

## Status actions

| Action | API | Effect |
|--------|-----|--------|
| Approve | `PATCH /company/admin/:id/status` `{ "status": "approved" }` | `companies.status = approved`; sets `approved_at`, `approved_by_super_admin_id`; registrant role → `company_admin` |
| Reject | `PATCH …` `{ "status": "rejected" }` | `companies.status = rejected`; clears approval audit fields; registrant role → `member` if was admin |
| Set pending | `PATCH …` `{ "status": "pending" }` | `companies.status = pending`; clears approval audit fields; registrant role → `member` if was admin |

Legacy `POST /company/admin/:id/approve` may remain as a shortcut for approve-only flows.

## WebOnOne backend routes

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/v1/company/admin/me` | Identity JWT + super-admin email |
| `GET` | `/api/v1/company/admin/companies` | Identity JWT + super-admin email |
| `PATCH` | `/api/v1/company/admin/:id/status` | Identity JWT + super-admin email |
| `POST` | `/api/v1/company/admin/:id/approve` | Identity JWT + super-admin email (approve shortcut) |

Validation on WebOnOne BE via `requireSuperAdmin` middleware (Identity JWT + `super_admins` lookup).

## Seed credentials (interim)

Document in `webonone-v2/backend/.env.example`:

```env
SUPER_ADMIN_EMAIL=superadmin@webonone.local
SUPER_ADMIN_DISPLAY_NAME=Super Admin
```

Run seed via `npm run seed -w @webonone/webonone-backend`. Create the matching Identity user manually in local dev (register at Identity with the same email).

Future spec: promote Identity user to super admin via admin UI (deferred).

## Security

- Super-admin authorization uses the same Identity JWT as regular users; privilege is enforced by `super_admins` email allowlist.
- Do not expose admin APIs without `requireSuperAdmin`.
- Rate-limit login (deferred).
- Status changes audit `approved_by_super_admin_id` and `approved_at` on approve; cleared when moved to pending/rejected.

## Acceptance mapping (subtask 86ey2p61f)

| Criterion | Implementation |
|-----------|----------------|
| Super admin with hard-coded credentials | Seeded email in `super_admins`; Identity account with same email |
| List of companies | Companies page — all statuses |
| Approve / reject / pending | Status PATCH + 3-dot menu |
| Approve → user role admin | API sets `company_admin` on membership |
| Login via default page | `/login` only — no separate admin login |
