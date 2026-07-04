# 03 — Consumer migration

Remove local role tables and repoint each service to Identity-owned roles and JWT session claims.

## WebOnOne v2

### Remove

| Item | Action |
|------|--------|
| `users_roles` table | Drop via migration after Identity cutover |
| `userRole.repository.ts` local DB access | Replace with Identity API client |
| `GET /company/me/assumable-roles` | Proxy to Identity or move route to Identity (frontend calls Identity API base) |
| `syncEmailRoleForUser` DB writes | Remove Email sync that inserts `email_user_roles` |
| `syncDataRoleForUser` DB writes | Remove Data sync that inserts `data_user_roles` |
| `POST /company/me/sync-email-role` | Remove or no-op (deprecated); frontend stops calling |
| `POST /company/me/sync-data-role` | Remove or no-op (deprecated) |

### Keep / update

| Item | Change |
|------|--------|
| `companies` table | Unchanged — WebOnOne still owns company domain |
| `requireSuperAdmin` middleware | Check JWT `platform_role === 'super_admin'` **or** query Identity assignable roles once at token issue (prefer JWT claim) |
| Company registration | On approve/register, call Identity `POST /api/v1/roles` instead of local insert |
| Role selection dialog | After pick, call Identity `POST /api/v1/auth/session-role`; store new JWT in frontend |
| `getMyCompany` | Unchanged — uses company tables; session `company_id` from JWT when needed |

### Frontend

| File | Change |
|------|--------|
| `features/auth/` | Fetch assumable roles from Identity API |
| `syncEmailRole.ts` / `syncDataRole.ts` | Remove pre-handoff sync calls; handoff uses JWT with session claims |
| `AppLayout.tsx` | Email/Data nav handoff — no sync POST before redirect |

### Env

| Key | Purpose |
|-----|---------|
| `IDENTITY_API_BASE_URL` | WebOnOne BE → Identity role API |
| `IDENTITY_SERVICE_API_KEY` | Service-to-service auth |

## Email

### Remove

| Item | Action |
|------|--------|
| `email_user_roles` table | Drop migration |
| `user.service.ts` `loadUserRole` / `syncUserRole` | Delete |
| Auth middleware DB role lookup | Read `platform_role`, `company_id` from JWT |

### Keep

| Item | Notes |
|------|-------|
| `email_users` | User profile copy for Email domain |
| `email_companies` | Company name copy for templates/history scoping |

Role-based history/template filtering uses JWT claims on `req.user` — same effective behaviour as today after handoff sync.

### Middleware change

```typescript
// After jwt.verify — no DB call
req.user = {
  id: decoded.sub,
  email: decoded.email,
  role: decoded.platform_role ?? 'member',
  companyId: decoded.company_id ?? null,
}
```

Validate `platform_role` is one of `super_admin` | `company_admin` | `member`; default `member` if claim absent (legacy tokens during rollout).

## Data

### Remove

| Item | Action |
|------|--------|
| `data_user_roles` table | Drop migration |
| `user.service.ts` | Delete |
| `internal.controller.ts` sync-user-role route | Delete |
| `POST /api/v1/internal/sync-user-role` | Remove |

### Middleware

Same JWT claim pattern as Email (see above).

### `requireSuperAdmin` on mutating catalog routes

Uses `req.user.role` from JWT — user must have selected `super_admin` session role (or hold only super_admin assignable role and received token with that claim).

## Cross-service handoff (updated)

```text
Before (1.11.0):
  WebOnOne → POST sync-email-role → Email DB insert → redirect with JWT

After (1.11.1):
  User JWT already has platform_role + company_id
  WebOnOne → redirect to Email with same JWT (auth-code handoff unchanged)
  Email BE → verify JWT → read claims (no DB)
```

Identity login and role dialog must complete **before** satellite handoff so JWT carries session role.

## Cursor rules updates

| Rule file | Update |
|-----------|--------|
| `webonone-v2-project.mdc` | Remove `users_roles` from DB ownership; note Identity API |
| `email-project.mdc` | Remove "Role copy in Email DB" |
| Identity skill / new rule | Document `users_roles` ownership |

## Verification per service

| Service | Command |
|---------|---------|
| Identity | `npm run type-check -w identity-root` · `npm run migrate -w identity-root` |
| WebOnOne | `npm run type-check -w webonone-v2-root` |
| Email | `npm run type-check -w email-root` |
| Data | `npm run type-check -w data-root` |
