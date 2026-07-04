# 02 — Identity `users_roles`

Identity owns platform role assignments. Schema and semantics match [1.9.3 `users_roles`](../1.9.3/05-webonone-users-roles.md) — moved from WebOnOne DB to Identity DB.

## Schema

### `users_roles` (Identity DB)

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `user_id` | CHAR(21) | FK → `users.id` ON DELETE CASCADE |
| `role` | ENUM | `super_admin`, `company_admin`, `member` |
| `company_id` | CHAR(21) NULL | **Logical** company id (WebOnOne `companies.id` copy); no cross-DB FK |
| `created_at` | TIMESTAMP(3) | |
| `updated_at` | TIMESTAMP(3) | |

**Constraints (same as 1.9.3):**

- `super_admin` → `company_id IS NULL`
- `company_admin` / `member` → `company_id NOT NULL`
- Unique `(user_id, company_id, role)`
- Index on `user_id`, `company_id`

`company_id` is an opaque foreign **id copy** — Identity does not own the `companies` table; WebOnOne validates company existence before assigning company-scoped roles.

## Migration

1. Create `users_roles` in Identity (`identity/backend/migrations/`).
2. Copy all rows from WebOnOne `users_roles` → Identity `users_roles` (one-time data migration script or SQL export in migration phase).
3. WebOnOne migration drops `users_roles` after cutover.

## Identity API (versioned)

Base: `/api/v1/roles` (authenticated; service-to-service or user JWT as appropriate).

| Method | Path | Caller | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/roles/me/assumable` | User JWT | List roles user may assume (replaces WebOnOne `GET /company/me/assumable-roles`) |
| GET | `/api/v1/roles/user/:userId` | Internal key or super-admin JWT | List assignable roles for user |
| POST | `/api/v1/roles` | Internal key / WebOnOne BE | Assign role row |
| PATCH | `/api/v1/roles/:id` | Internal key / WebOnOne BE | Update role row |
| DELETE | `/api/v1/roles/:id` | Internal key / WebOnOne BE | Remove role row |

**Internal authentication:** `IDENTITY_SERVICE_API_KEY` header (same pattern as auth-code exchange) for WebOnOne backend calls. Never expose write endpoints to browser without super-admin guard.

### Assumable roles response

```json
{
  "roles": [
    { "role": "super_admin", "companyId": null, "companyName": null },
    { "role": "company_admin", "companyId": "01HQ...", "companyName": "Acme Ltd" }
  ]
}
```

`companyName` optional — WebOnOne may enrich from its `companies` table when rendering the dialog; Identity returns ids only if cross-service name lookup is deferred.

## JWT re-issue (session role)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/session-role` | Accept `{ platformRole, companyId }`; validate against caller's assignable rows; return new JWT with claims |

See [04-jwt-session-role.md](./04-jwt-session-role.md).

## Super-admin seed

Move seed logic from `webonone-v2/backend/src/seedSuperAdmin.ts` to Identity:

- Env: `SUPER_ADMIN_USER_ID`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_DISPLAY_NAME` on Identity backend.
- `npm run seed -w identity-root` upserts `super_admin` row for env user id.

WebOnOne `.env` may keep `SUPER_ADMIN_USER_ID` for docs/compatibility but seed runs in Identity.

## Repository layout (Identity backend)

| Path | Responsibility |
|------|----------------|
| `src/repositories/userRole.repository.ts` | CRUD/query (port from WebOnOne) |
| `src/services/userRole.service.ts` | Business rules, assumable roles, validation |
| `src/routes/roles.routes.ts` | Public + internal routes |
| `src/routes/auth.routes.ts` | Extend with `session-role` re-issue |
| `src/middleware/requireSuperAdmin.ts` | Check Identity `users_roles` + JWT `sub` |

## Events (optional, future)

`UserRoleAssigned` / `UserRoleRevoked` events may be added later for audit. **Not required for 1.11.1** — WebOnOne writes through Identity API synchronously during company flows.
