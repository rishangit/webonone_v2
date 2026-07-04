# 01 — Overview (1.11.1)

## Vision

Platform permissions (`super_admin`, `company_admin`, `member`) are **identity concerns** — who a user is allowed to be on the platform. Today the same logical data is copied into four databases (`users_roles` in WebOnOne, `email_user_roles` in Email, `data_user_roles` in Data, plus legacy patterns). That violates microservice ownership, creates sync bugs, and forces handoff endpoints that write duplicate rows.

**Identity** becomes the sole owner of `users_roles`. Consumer services verify JWT locally and read **session role** from signed claims — never from a local role table and never with per-request HTTP to Identity on hot paths.

## User story

As a platform architect, I want user roles stored only in the Identity service so that WebOnOne, Email, and Data do not duplicate role data and permissions stay consistent.

## Goals (1.11.1)

1. **Single source of truth** — `users_roles` table lives in Identity DB only.
2. **Remove duplicates** — drop `users_roles` (WebOnOne), `email_user_roles` (Email), `data_user_roles` (Data).
3. **JWT session role** — active session role and optional `company_id` travel in JWT claims; all consumers use the same contract.
4. **Preserve 1.9.4 behaviour** — role selection dialog, assumable roles, Email/Data nav scoping by session role — without consumer DB copies.
5. **WebOnOne company flows** — registration, approval, super-admin seed still work; role mutations go through Identity API.
6. **Data migration** — existing role rows migrate from WebOnOne → Identity; Email/Data role tables dropped (data already derived from WebOnOne sync).

## Current duplication (problem)

| Service | Table | Purpose today |
|---------|-------|---------------|
| WebOnOne v2 | `users_roles` | Canonical assignable roles; company registration; super admin |
| Email | `email_user_roles` | Copy synced on handoff for `loadUserRole` in auth middleware |
| Data | `data_user_roles` | Copy synced on handoff for `loadUserRole` in auth middleware |
| Identity | *(none)* | Auth only — no role storage |

Every authenticated request in Email/Data hits `loadUserRole(userId)` against a local copy. WebOnOne is the writer; satellites are stale copies.

## Target architecture

```text
Identity DB ── users_roles (canonical)
     │
     ├── Identity API ── role CRUD, assumable roles, internal provision
     │
     └── JWT (iss=identity) ── sub, email, platform_role, company_id (session)
              │
              ├── WebOnOne BE ── verify JWT; no users_roles table
              ├── Email BE ── verify JWT; no email_user_roles table
              └── Data BE ── verify JWT; no data_user_roles table
```

**Forbidden after 1.11.1:**

- Local `*_user_roles` tables in any consumer
- Per-request Identity HTTP to resolve role on API hot path
- Handoff endpoints that INSERT role rows into consumer DBs

## Scope (1.11.1)

### In scope

- Identity migration: create `users_roles` with same semantics as [1.9.3](../1.9.3/05-webonone-users-roles.md).
- Data migration: copy rows from WebOnOne `users_roles` → Identity `users_roles`.
- Identity internal/versioned API for role queries and mutations (used by WebOnOne backend, not browser hot path).
- JWT claim extension: `platform_role`, `company_id` (nullable).
- Token re-issue endpoint when user selects session role (WebOnOne role dialog).
- WebOnOne: remove local table; call Identity for role assignment during company registration/approval/seed.
- Email/Data: remove role tables and `user.service` DB access; auth middleware reads JWT claims.
- Remove `POST /internal/sync-user-role` (Data) and WebOnOne→Email/Data role sync that writes DB rows.
- Update `.cursor/rules/` for webonone-v2, email, identity projects.

### Out of scope (1.11.1)

- Moving `companies` table to Identity (stays in WebOnOne).
- Moving `email_users` / `email_companies` (Email keeps user/company copies for its domain; only **roles** are removed).
- Redis/shared session store (JWT claims sufficient for 1.11.1).
- Fine-grained RBAC beyond three platform roles.
- Event bus for role changes (optional future; Identity API + JWT re-issue is sufficient).

## Glossary

| Term | Definition |
|------|------------|
| **Assignable role** | Row in Identity `users_roles` — what the user *may* assume (`super_admin`, `company_admin`, `member`) |
| **Session role** | Active role for this login session — carried in JWT `platform_role` |
| **Assumable roles** | Subset of assignable roles offered in the post-login dialog |
| **Role re-issue** | Identity endpoint returning a new JWT after session role selection |

## Success criteria

1. Identity DB has `users_roles`; WebOnOne, Email, Data DBs do **not** have role tables.
2. `npm run migrate` on each service succeeds on fresh and upgraded databases.
3. Super-admin seed creates row in Identity `users_roles`.
4. Company registration + approval assign roles via Identity API; WebOnOne company flows unchanged from user perspective.
5. Role selection dialog still works; after selection, new JWT contains correct `platform_role` and `company_id`.
6. Email and Data `requireAuth` resolves role from JWT — no `loadUserRole` DB query.
7. `npm run type-check` passes for identity-root, webonone-v2-root, email-root, data-root.
8. Handoff to Email/Data works without sync endpoints that write role rows.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — consolidate user roles in Identity | 86ey5n9zt | All docs |

### Source requirements (from ClickUp parent)

1. Keep `users_roles` table within Identity service.
2. Remove user role tables from Data, Email, WebOnOne v2.
3. Remove data duplication in role tables.
