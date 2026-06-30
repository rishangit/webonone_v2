# 04 — Email role handoff

Email access scope must follow the **session-selected** role, not the user's highest DB role.

## Current behaviour (pre-1.9.4)

`syncEmailRoleForUser` in `company.service.ts`:

1. If `super_admin` row exists → always sync `super_admin`.
2. Else use primary company membership role.

This ignores session choice — a super admin acting as **default user** would still get system Email access.

## Updated behaviour

### Request body (optional)

`POST /api/v1/company/me/sync-email-role`

```json
{
  "sessionRole": "member",
  "companyId": "01HQ..."
}
```

When `sessionRole` is present and valid for the caller's `users_roles`, sync **that** role to Email service.

### Validation rules

| Requested role | Validation |
|----------------|------------|
| `super_admin` | Caller must have `super_admin` row |
| `company_admin` | Caller must have `company_admin` for given `companyId` (or primary company) |
| `member` | Always allowed; sync `member` with optional `companyId` for context |

Invalid combination → `403` with message; frontend should not send invalid pairs.

### Fallback (no body)

When body omitted (legacy callers), preserve current auto-detect behaviour for backward compatibility during rollout; WebOnOne frontend **always** sends session role after 1.9.4.

## Email service (unchanged schema)

Existing `email_user_roles` table and `loadUserRole` continue to work. Sync payload from WebOnOne determines:

| Session role | Email history scope | Templates scope |
|--------------|--------------------|-----------------|
| `super_admin` | Platform / all companies | Platform templates |
| `company_admin` | Caller's `company_id` | Company + readable platform |
| `member` | Should not navigate to Email from WebOnOne; if handoff occurs, read-only member scope |

## Frontend handoff

Update `syncEmailRoleBeforeHandoff`:

```typescript
await apiClient('/company/me/sync-email-role', {
  method: 'POST',
  body: JSON.stringify({
    sessionRole: activeRole,
    companyId: activeCompanyId,
  }),
})
```

Call before `redirect(getEmailRedirectOptions(...))` in `AppLayout.handleEmailNavClick`.

Do not expose Email nav items when `activeRole === 'member'` — handoff should not trigger for default user in normal UX.

## Identity consumer

If Identity `AppLayout` syncs email role before handoff, pass through same optional body or rely on WebOnOne as source of truth when launching from core only.
