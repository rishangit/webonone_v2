# 02 — Company customers list (Identity → Users)

ClickUp: [86eyd50vy](https://app.clickup.com/t/86eyd50vy)

## Problem

Identity **Users** (`/users`) is currently **super-admin only** and lists all registered platform users. Company owners have no place under Identity to see who belongs to their company as customers.

## Target UX

| Role | Identity → Users behavior |
|------|---------------------------|
| **Super admin** | Unchanged — browse all platform users (search, role filter, pagination) |
| **Company owner** (`company_admin` + session `companyId`) | List **customers** of the session company; page title/description reflect company customers; **Add** in header actions |
| **Member / Default User** | No access (redirect or hide nav as today) |

### List row

Reuse existing Users row pattern (`Avatar`, display name, email). Optional badge: **Customer** / role label `Member`. No 3-dot remove in v1 (out of scope).

### Empty state

`ItemListEmpty`: “No customers yet. Add a user to this company.”

### Nav

Left menu **Identity → Users** remains the entry (already present for roles that can open Users). Ensure company_admin session in Identity (standalone or WebOnOne embed handoff) can open `/users` without being redirected to `/profile`.

## API

### List company customers

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/companies/:companyId/customers` | User JWT; caller must be `company_admin` for that `companyId` (or `super_admin`) |

Query: `page`, `pageSize`, `search` (name/email) — same pagination shape as existing users list.

Response items:

```json
{
  "items": [
    {
      "id": "user_…",
      "displayName": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": null,
      "phone": "+1555…",
      "role": "member",
      "companyId": "comp_…",
      "addedAt": "2026-07-23T…"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 24
}
```

**Source:** Identity `users_roles` where `company_id = :companyId` and `role = 'member'`, joined to `users`.

**Note:** Company owners (`company_admin` rows) are **not** listed as customers. Owners already appear via ownership flows elsewhere.

### Alternative (acceptable)

Extend existing `GET /api/v1/users` with required `companyId` + `role=member` when caller is company_admin — same filtering rules. Prefer explicit `/companies/:companyId/customers` for clarity.

## Frontend

| Path | Change |
|------|--------|
| `identity/frontend/.../UsersPage.tsx` | Branch on `isSessionSuperAdmin` vs `isSessionCompanyAdmin`; company mode loads customers for JWT `companyId` |
| Users store / API | New list action or `extra.companyId` mode |
| Nav visibility | Allow company_admin to see Users item when session has `companyId` |

## Acceptance

1. Company owner with session company sees only that company’s `member` users.
2. Super admin path unchanged.
3. Member cannot open the company customers list.
4. Search/pagination work in company mode.
