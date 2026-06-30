# 02 — Identity OTP password reset (1.9.1)

Multi-step forgot-password flow owned by **Identity**. Email service sends the OTP message only — Identity owns generation, storage, verification, and password update.

## Flow

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Step 1: Email   │────►│ Step 2: OTP      │────►│ Step 3: New     │
│ ForgotPassword  │     │ VerifyOtpPage    │     │ ResetPassword   │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
   Identity BE              Identity BE
   generate OTP             verify OTP
   call Email send          issue reset session
```

### Step 1 — Request OTP

**Route:** `/forgot-password` (existing).

**UI changes:**

- Update copy: "We'll send a 4-digit code if the email exists" (not reset link).
- On submit: `POST /api/v1/auth/forgot-password` with `{ email }`.
- On success: navigate to `/verify-reset-otp?email={encoded}` (preserve redirect query params for embed mode).

**Backend (`requestPasswordReset`):**

1. Lookup user by email (case-insensitive).
2. If user exists:
   - Generate **4-digit** OTP: `1000`–`9999` (crypto-safe random).
   - Store hash of OTP + `expires_at` = now + **1 minute**; invalidate previous unused OTPs for same user.
   - Call Email internal API (see below).
3. Always return `{ message: 'If the email exists, a verification code has been sent.' }` — no `resetToken` in response.

### Step 2 — Verify OTP

**Route:** `/verify-reset-otp` (new).

**UI:**

- Show masked email hint.
- **OtpInput** from `@webonone/ui-kit` — `length={4}`, numeric cells with auto-advance and paste support.
- **Countdown timer** — 60 seconds from page load or from server `expiresAt` in response; at zero disable submit and show "Code expired — request a new one" with link back to forgot-password.
- **Attempt counter** — show remaining tries (e.g. "2 attempts left") from server `attemptsRemaining` on each failed verify.
- Submit: `POST /api/v1/auth/verify-reset-otp` with `{ email, otp }`.
- On success: navigate to `/reset-password` with short-lived **reset session** (see below) — not the OTP in the URL.
- On **3rd wrong OTP**: disable input and submit; show "Too many incorrect attempts — request a new code" with link to forgot-password (same as locked/expired state).

**Backend (`verifyResetOtp`):**

1. Load latest unused OTP record for email.
2. Reject if expired, `attempt_count >= 3`, or OTP already locked.
3. On hash **match**: mark OTP used; create **reset session** token (opaque, server-side, ~10 min TTL) returned to client as `{ resetSessionToken }` (store in memory/state — **not** in query string).
4. On hash **mismatch**: increment `attempt_count`. If `attempt_count` reaches **3**, invalidate the OTP (`used_at` or `locked_at`) and return `403` with code `OTP_MAX_ATTEMPTS` — no further verifies allowed for that issuance. Otherwise return `401` with `attemptsRemaining: 3 - attempt_count`.

### Step 3 — Set new password

**Route:** `/reset-password` (update existing).

**UI:**

- Require `resetSessionToken` from step 2 (route state or sessionStorage — never OTP in URL).
- Fields: new password + confirm (existing `ResetPasswordForm` pattern).
- Submit: `POST /api/v1/auth/reset-password` with `{ resetSessionToken, newPassword }`.

**Backend (`resetPassword`):**

1. Validate reset session token (not legacy link token for OTP path).
2. Update password hash; invalidate session and all OTPs for user.
3. Return success → redirect to login.

### Legacy link reset

1.9.0 link-based `?token=` reset may remain for backward compatibility or be removed. **Primary UX is OTP-only** for 1.9.1. If both exist, document in Identity routes which path is active for forgot-password entry.

## Database (Identity)

New table or extend existing reset storage:

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | Primary key |
| `user_id` | CHAR(21) | FK to users |
| `otp_hash` | VARCHAR | bcrypt or HMAC of 4-digit code |
| `expires_at` | DATETIME | +1 minute from creation |
| `used_at` | DATETIME nullable | Set on successful verify |
| `attempt_count` | INT | Failed verify attempts (max **3** per OTP) |
| `created_at` | DATETIME | |

**Reset sessions** (post-OTP):

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | |
| `user_id` | CHAR(21) | |
| `token_hash` | VARCHAR | |
| `expires_at` | DATETIME | ~10 minutes |
| `used_at` | DATETIME nullable | |

Migration in `identity/backend/migrations/`.

## Email internal send

Identity calls Email (same pattern as [1.9.0/05-platform-integration.md](../1.9.0/05-platform-integration.md)):

```typescript
POST {EMAIL_API_BASE_URL}/api/v1/internal/send
X-Email-Service-Key: {EMAIL_SERVICE_API_KEY}
{
  templateSlug: 'password_reset_otp',
  toEmail: user.email,
  payload: {
    userName: user.displayName ?? user.email,
    otp: rawOtp
  },
  requestedByService: 'identity'
}
```

- **Never** log raw OTP in Identity or Email application logs.
- Queue + history recorded in Email DB as system send (`company_id` null).

## API summary

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/auth/forgot-password` | `{ email }` | Generic message |
| POST | `/api/v1/auth/verify-reset-otp` | `{ email, otp }` | Success: `{ resetSessionToken, expiresAt }`. Wrong OTP: `{ message, attemptsRemaining }`. Locked (3 failures): `403 OTP_MAX_ATTEMPTS` |
| POST | `/api/v1/auth/reset-password` | `{ resetSessionToken, newPassword }` or legacy `{ token, newPassword }` | `{ message }` |

Zod validation on all bodies; `validateBody` middleware per `nodejs-express.mdc`.

## Identity frontend files

| File | Change |
|------|--------|
| `ForgotPasswordPage.tsx` | Copy + navigation to verify step |
| `ForgotPasswordForm.tsx` | Post-success navigate |
| `VerifyResetOtpPage.tsx` | **New** — `OtpInput` + countdown |
| `ResetPasswordPage.tsx` | Accept session token from state |
| `ResetPasswordForm.tsx` | Submit `resetSessionToken` |
| `App.tsx` | Route `/verify-reset-otp` |
| `authApi.ts` | `verifyResetOtp`, update `resetPassword` |

Embed mode: preserve `parentOrigin` / redirect query through all three steps.

## Security

| Rule | Detail |
|------|--------|
| OTP entropy | 4 digits = 9000 values; mitigate with 1-min TTL + **max 3 failed attempts** per OTP |
| Max attempts | **3** wrong OTP entries per issuance; then OTP invalidated — user must request a new code |
| No OTP in URL | Session token only after verify |
| Enumeration | Generic forgot-password response |
| Expiry | Server rejects expired OTP regardless of client timer |
| Single use | OTP and reset session invalidated after password change |

## Acceptance

- [ ] Three-step flow works standalone and in embed mode
- [ ] OTP email received with correct code
- [ ] Countdown reflects 1-minute expiry
- [ ] Expired / wrong OTP blocked
- [ ] After **3** wrong OTP entries, verify rejected and UI locked until user requests a new code
- [ ] Password reset completes after valid OTP
- [ ] Email sent via internal API only
