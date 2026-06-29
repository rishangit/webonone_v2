# 05 — Platform integration and release (1.9.0)

Identity and WebOnOne integration, security rules, end-to-end checklist. Implements ClickUp subtask **86ey388eg**.

## Integration overview

```text
Identity BE ──HTTP internal──► Email BE ──SMTP──► Mail provider
WebOnOne BE ──HTTP internal──► Email BE

Identity FE ──► Identity BE only (never Email send)
WebOnOne FE ──► WebOnOne BE only (never Email send)
WebOnOne FE ──redirect──► Email FE (menu entry)
```

## Identity integration

### Password reset

**Owner:** Identity backend (`identity/backend/src/services/auth.service.ts`, routes).

Changes:

1. On forgot-password: generate secure token (existing), store hash + expiry **1 hour**, invalidate older unused tokens for same user.
2. Call Email internal API:

```typescript
POST {EMAIL_API_BASE_URL}/api/v1/internal/send
X-Email-Service-Key: {EMAIL_SERVICE_API_KEY}
{
  templateSlug: 'password_reset',
  toEmail: user.email,
  payload: {
    userName: user.displayName,
    actionUrl: `${IDENTITY_FRONTEND_ORIGIN}/reset-password?token=${rawToken}`
  },
  requestedByService: 'identity'
}
```

3. **Always** return generic success for forgot-password (prevent email enumeration).
4. Reset-password route unchanged — validates token locally.

### Email verification

1. On register or resend-verification: generate token, store with **24 hour** expiry.
2. Call Email with `templateSlug: 'email_verification'` and `actionUrl` pointing to Identity verify route.
3. Resend endpoint may return clearer errors (rate limit / already verified).

### Identity env additions

`identity/backend/.env.example`:

```env
EMAIL_API_BASE_URL=http://localhost:4004
EMAIL_SERVICE_API_KEY=
```

### Identity FE

No changes to call Email directly — only existing auth API calls.

## WebOnOne integration

### Company lifecycle emails

In `webonone-v2/backend` company service hooks:

| Event | Template | When |
|-------|----------|------|
| Registration submitted | `company_registered` | After company create |
| Approved | `company_approved` | Super admin approve |
| Rejected | `company_rejected` | Super admin reject |

Payload includes `companyName`, admin email, optional message from reviewer.

### User role sync

Email permissions depend on role copy:

- On company membership change in WebOnOne, call Email internal endpoint (new for 1.9.0):

`POST /api/v1/internal/sync-user-role`

Body: `{ userId, role, companyId? }` — upserts `email_user_roles`.

Alternatively, lazy upsert on first Email login from JWT claims if WebOnOne embeds role in token (prefer explicit sync on membership change).

### WebOnOne env additions

`webonone-v2/backend/.env.example`:

```env
EMAIL_API_BASE_URL=http://localhost:4004
EMAIL_SERVICE_API_KEY=
```

`webonone-v2/frontend/.env.example`:

```env
VITE_EMAIL_ORIGIN=http://localhost:3004
```

### Core nav

Add Email link per [02-email-scaffold.md](./02-email-scaffold.md).

## Security

| Rule | Detail |
|------|--------|
| Internal API key | Required on all `/api/v1/internal/*`; rotate via env |
| JWT on public API | Verify signature, `iss`, `aud`, `exp` locally |
| No SMTP in consumers | Identity/WebOnOne `.env` have API URL + key only |
| Audit | Log provider changes, template deletes, manual sends (super admin) |
| Rate limit | Optional: throttle internal send per service (future) |
| Forgot-password | Generic response always |

## Release checklist

End-to-end verification:

1. [ ] Email standalone: login → dashboard
2. [ ] WebOnOne → Email menu → same user session
3. [ ] Forgot password → email received → reset works
4. [ ] Register → verification email → verify works
5. [ ] Company register → notification email
6. [ ] Approve/reject → correct emails
7. [ ] Company admin cannot access Providers
8. [ ] Queue processes; history populated
9. [ ] `npm run type-check` passes for email-root, identity-root, webonone-v2-root
10. [ ] Root `npm run dev` includes email service

## Acceptance (subtask 4)

- [ ] Identity reset + verification flows use Email service
- [ ] WebOnOne company emails triggered
- [ ] Role restrictions enforced across services
- [ ] Security rules applied
- [ ] Full flow ready for release
