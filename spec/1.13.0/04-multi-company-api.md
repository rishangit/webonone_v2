# 04 — Multi-company API

Company data stays in WebOnOne (`webonone_v2.companies`). Platform roles stay in Identity (`users_roles`). Identity already allows multiple company-scoped roles per user (`UNIQUE (user_id, company_id, role)`).

## Company status (required)

`companies.status` is an enum with **exactly three** values:

| Value | Meaning |
|-------|---------|
| `pending` | Submitted by client; awaiting super-admin decision |
| `approved` | Super admin accepted the company |
| `rejected` | Super admin declined the company |

### Lifecycle

```text
POST /company/register (client, Identity JWT)
        │
        ▼
   status = pending     ◄── default; must not skip to approved
        │
        ├─ PATCH /company/admin/:id/status { status: "approved" }  (super admin)
        │         or POST /company/admin/:id/approve
        │
        ├─ PATCH /company/admin/:id/status { status: "rejected" }  (super admin)
        │
        └─ PATCH /company/admin/:id/status { status: "pending" }   (super admin, optional reset)
```

| Actor | Allowed status actions |
|-------|------------------------|
| Registrant (normal user) | Create only → always `pending`; read own status on All Companies |
| Super admin | Set `approved`, `rejected`, or `pending` on any company via `/companies` |

**Forbidden:** auto-approving on register; client endpoints that set `approved` / `rejected`; inventing additional status values.

## Problem

| Endpoint / helper | Today | Issue for 1.13.0 |
|-------------------|-------|------------------|
| `GET /api/v1/company/me` | Returns **one** primary company via `findPrimaryCompanyRole` | List page needs **all** memberships |
| `POST /api/v1/company/register` | Creates company + Identity role | Must not reject users who already have a company; must set `pending` |
| Super-admin status APIs | Approve / reject / pending | Unchanged — required path out of Pending |

## New / updated API

### `GET /api/v1/company/me/companies`

| Item | Detail |
|------|--------|
| Auth | Identity JWT (`requireAuth`) |
| Response | `{ items: MyCompanySummary[] }` |

```ts
type CompanyStatus = 'pending' | 'approved' | 'rejected'

type MyCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: CompanyStatus
  /** Company Owner = `company_admin`; Member = `member` */
  role: 'member' | 'company_admin'
  createdAt: string
  approvedAt: string | null
}
```

**Behavior:**

1. Call Identity (existing client) for all company-scoped roles for `sub`.
2. Load matching `companies` rows from WebOnOne DB.
3. Map each to `MyCompanySummary` (omit orphaned roles with missing company rows); include **current** `status`.
4. Sort: newest `createdAt` first (or stable by company created_at).

### `GET /api/v1/company/me`

Keep for session / legacy callers that need a **primary** company:

- Prefer first `company_admin` membership, else earliest company role (same as `findPrimaryCompanyRole` today).
- Return `404` / null payload when the user has **zero** companies.

All Companies list **must not** rely on this endpoint alone.

### `POST /api/v1/company/register`

| Rule | Detail |
|------|--------|
| Multi allowed | User **may** register another company while owning pending, approved, or rejected companies |
| Status on create | **Always** `companies.status = pending` — never `approved` or `rejected` on submit |
| Forbidden | Only block if validation fails or Identity insert conflicts on the **same** `company_id` |
| Role on create | Identity role for registrant = **`company_admin` (Company Owner)** for the **new** `company_id` — required; never create as `member` on register |
| Email | Existing `company_registered` transactional email still fires per registration |
| Session on create | Do **not** auto-reissue JWT into that company; user **Login**s from All Companies after approval ([06-company-owner-login.md](./06-company-owner-login.md)) |

Do **not** reintroduce a global “one company per user” unique constraint on `user_id`.

### Super-admin status (unchanged, required for Pending exit)

| Method | Path | Body / notes |
|--------|------|----------------|
| `PATCH` | `/api/v1/company/admin/:id/status` | `{ status: 'pending' \| 'approved' \| 'rejected' }` |
| `POST` | `/api/v1/company/admin/:id/approve` | Approve shortcut → `approved` |

Approval side effects (from 1.6.0) remain: audit fields `approved_at` / `approved_by_*`; role promotion rules as already implemented.

## Repository / client helpers

| Layer | Change |
|-------|--------|
| `identityRoleClient` / Identity internal roles | Already lists roles by user — reuse `findCompanyRolesByUserId` |
| `company.repository` | `findCompaniesByIds(ids: string[])` if missing |
| `company.service` | `listMyCompanies(userId)`; register continues to hard-code `status: 'pending'` |

## Session / assumable roles + company Login

Existing `GET /company/me/assumable-roles` and Identity `POST /auth/session-role` power both the post-login role dialog and **All Companies → 3-dot → Login**.

| Rule | Detail |
|------|--------|
| Multi approved | Surface **each** approved company the user owns (`company_admin`) — must not hard-code a single company |
| Company Owner on create | Register always inserts `company_admin` for the new `company_id` |
| Login from list | Client reissues session with `platformRole: company_admin` + that `companyId` → user has company owner rights |
| Pending / approved | Company Owner may Login and appear in assumable roles |
| Rejected | Must **not** unlock company-owner platform features via assumable roles or Login |

Header company switcher chrome remains out of scope; **Login** on All Companies is the in-scope switcher for 1.13.0. Full detail: [06-company-owner-login.md](./06-company-owner-login.md).

## Security

- List endpoint returns **only** companies linked to the JWT `sub`.
- No cross-user company leakage.
- Status mutations remain behind `requireSuperAdmin`.
- Client JWT cannot set company status.

## Acceptance

1. User with 0 companies → `{ items: [] }`.
2. After two registrations → `{ items }` length 2, both `status: "pending"`, both with role `company_admin` (Company Owner).
3. Second `POST /register` succeeds (no 409 for “already registered”); response/company row never returns `approved` immediately after register.
4. Super admin `PATCH` to `approved` / `rejected` updates status; user’s list reflects the new badge.
5. `GET /company/me` still returns a sensible primary when ≥1 company exists.
6. After approval, session-role reissue for that `companyId` as `company_admin` succeeds; pending/rejected must not grant owner session.
7. Type-check / smoke for WebOnOne backend routes.
