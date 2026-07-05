# 04 — JWT session role contract

Consumers must resolve permissions without local role tables or per-request Identity calls. **Signed JWT claims** carry the active session role.

## Standard claims (unchanged)

| Claim | Source |
|-------|--------|
| `sub` | Identity user id (CHAR(21)) |
| `email` | User email |
| `iss` | Identity issuer |
| `aud` | Consumer audience |
| `exp` | Expiry |

## New claims (1.11.1)

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `platform_role` | string | After role selection | `super_admin` \| `company_admin` \| `member` |
| `company_id` | string \| null | When company-scoped | WebOnOne company id copy; null for `super_admin` |

### Defaults at initial login

When user has **one** assumable role, Identity sets claims automatically in the first JWT (no dialog).

When user has assignable **`super_admin`**, Identity **always** auto-selects `super_admin` in the first JWT and auth JSON — even if other company-scoped roles exist (1.11.1 delta, subtask 86ey5pc30).

When user has **multiple** non–super-admin assumable roles, initial JWT may omit `platform_role`; frontend **must** call session-role re-issue before accessing role-gated features.

### Auth JSON response fields (1.11.1 delta)

Login, refresh, auth-code exchange, and session-role re-issue responses include when session role is resolved:

| Field | Type | Description |
|-------|------|-------------|
| `platformRole` | string | Same value as JWT `platform_role` claim |
| `companyId` | string \| null | Same value as JWT `company_id` claim |

Omitted when session role is not yet determined (multi-role without super-admin auto-default).

## Token re-issue flow

```text
1. User logs in → JWT (may lack platform_role if multi-role)
2. WebOnOne fetches GET /api/v1/roles/me/assumable (Identity)
3. User picks role in dialog
4. POST /api/v1/auth/session-role { platformRole, companyId }
5. Identity validates against users_roles assignable rows
6. Returns { token, expiresAt } with platform_role + company_id claims
7. Frontend replaces stored JWT; all services verify same token
```

### Request body

```json
{
  "platformRole": "company_admin",
  "companyId": "01HQXYZ..."
}
```

### Validation

| Requested | Rule |
|-----------|------|
| `super_admin` | Caller has assignable `super_admin` row |
| `company_admin` | Caller has `company_admin` for `companyId` |
| `member` | Always allowed if user has any assignable role or none (default user) |

Invalid → `403`.

## Consumer verification

All backends (`webonone-v2`, `email`, `data`, `media`):

```typescript
const decoded = jwt.verify(token, env.jwtSecret, { issuer, audience }) as {
  sub: string
  email: string
  platform_role?: PlatformRole
  company_id?: string | null
}

const role = decoded.platform_role ?? 'member'
const companyId = decoded.company_id ?? null
```

**No** `loadUserRole(db)` after this change.

## Assignable vs session role

| Concept | Storage | Used when |
|---------|---------|-----------|
| Assignable | Identity `users_roles` | Dialog options; validating re-issue requests; WebOnOne company assignment |
| Session | JWT claims | Every API request in all services |

A super admin may assignably hold `super_admin` but session-select `member` for Email-hidden UX (1.9.4) — JWT `platform_role: member` enforces that without Email DB copy.

## Backward compatibility

During rollout on `spec/1.11.1` branch:

1. Deploy Identity with `users_roles` + re-issue endpoint first.
2. Migrate data from WebOnOne.
3. Deploy consumers with JWT claim reads; remove sync endpoints.
4. Drop consumer role tables.

Tokens without `platform_role` default to `member` for at most one release; log warning in dev.

## Security

- Claims are signed by Identity — consumers verify signature + `iss` + `aud` + `exp` locally.
- Never pass `platform_role` in query strings or postMessage outside signed JWT.
- Re-issue endpoint requires valid bearer token; cannot escalate beyond assignable rows.

## Shared secret

`JWT_SECRET` duplicated in each service `backend/.env` (unchanged convention). All services must accept tokens with new claims without schema migration — claims are optional JWT fields.
