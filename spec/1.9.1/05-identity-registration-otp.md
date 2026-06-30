# 05 — Identity registration email verification OTP (1.9.1)

Multi-step **registration wizard** in Identity: verify email with a **4-digit OTP** (Email service) before collecting profile and password. Reuses `OtpInput`, 1-minute OTP TTL, and **3-attempt** lockout (same rules as password reset).

## Flow

```text
Step 1: Email          →  Step 2: OTP verify  →  Step 3: Profile  →  Step 4: Password
request-email-otp         verify-email-otp        first/last name      complete registration
```

### Step 1 — Email address

**UI:** Email field only; submit sends OTP.

**API:** `POST /api/v1/auth/register/request-email-otp` `{ email }`

- Reject with `409 EMAIL_EXISTS` if email already registered (user can go to login).
- Generate 4-digit OTP; store hash keyed by **email** (no user row yet).
- Send via Email internal API — template `email_verification_otp` with `{ userName: email local-part or email, otp }`.
- Response: `{ message: 'If the email is available, a verification code has been sent.' }` (generic when email taken optional — prefer explicit 409 for registration UX).

### Step 2 — OTP verification

**UI:** Centered `OtpInput` (`length={4}`), 60s countdown, attempts remaining — mirror `VerifyResetOtpPage`.

**API:** `POST /api/v1/auth/register/verify-email-otp` `{ email, otp }`

- On success: `{ registrationSessionToken, expiresAt }` (~30 min TTL).
- Same error codes as reset OTP: `INVALID_OTP`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`.

### Step 3 — Personal information

**UI:** First name, last name (required). Continue stores values in wizard state; no API call yet.

### Step 4 — Password and create account

**UI:** Password + confirm password; submit creates account.

**API:** `POST /api/v1/auth/register/complete` `{ registrationSessionToken, firstName, lastName, password }`

- Validate session token (email verified); create user with `is_email_verified: true`.
- Invalidate session and OTP rows for that email.
- Response: `{ user }` — same shape as legacy register.
- **No** post-register link verification email (email already verified).

**Google sign-in** unchanged — bypasses this wizard.

## Database (Identity)

**`registration_email_otps`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `email` | VARCHAR | Normalized lowercase |
| `otp_hash` | VARCHAR(64) | |
| `expires_at` | DATETIME | +1 minute |
| `used_at` | DATETIME nullable | |
| `attempt_count` | INT | Max 3 |
| `created_at` | DATETIME | |

**`registration_sessions`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) | PK |
| `email` | VARCHAR | |
| `token_hash` | VARCHAR(64) | |
| `expires_at` | DATETIME | ~30 minutes |
| `used_at` | DATETIME nullable | |

## Email template

Seed **`email_verification_otp`** in Email DB (platform scope) with placeholders `userName`, `otp` — same render pattern as `password_reset_otp`.

## API summary

| Method | Path | Body |
|--------|------|------|
| POST | `/auth/register/request-email-otp` | `{ email }` |
| POST | `/auth/register/verify-email-otp` | `{ email, otp }` |
| POST | `/auth/register/complete` | `{ registrationSessionToken, firstName, lastName, password }` |

Remove single-shot `POST /auth/register` (replaced by wizard complete).

## Frontend files

| File | Change |
|------|--------|
| `RegisterPage.tsx` | Four-step wizard orchestration |
| `RegisterEmailStep.tsx` | **New** — step 1 |
| `RegisterVerifyOtpStep.tsx` | **New** — step 2, `OtpInput` |
| `RegisterProfileStep.tsx` | **New** — step 3 |
| `RegisterPasswordStep.tsx` | **New** — step 4 |
| `registrationEmailStorage.ts` | Session storage for email between steps |
| `registrationSessionStorage.ts` | Session token after OTP |
| `authApi.ts` | Three new endpoints; remove old `register` |
| `authSchemas.ts` | Schemas per step + confirm password |
| `authEpics.ts` / `authSlice.ts` | `completeRegistration` flow |

Embed mode: preserve `redirectQuery` across all steps (same as forgot-password).

## Security

| Rule | Detail |
|------|--------|
| OTP TTL | 1 minute |
| Max attempts | 3 per OTP issuance |
| Session TTL | 30 minutes to finish steps 3–4 |
| Email uniqueness | Checked on step 1 and again on complete |
| No OTP in URL | Session token in memory/sessionStorage only |

## Acceptance

- [ ] Four-step registration in browser and embed mode
- [ ] OTP email via `email_verification_otp` template
- [ ] User created with `is_email_verified: true`
- [ ] `409` when email already registered on step 1
- [ ] Google registration unchanged
- [ ] `npm run type-check -w identity-root` and `email-root` pass

## ClickUp

Subtask **86ey3t18g** — need to email verification for the user registration.
