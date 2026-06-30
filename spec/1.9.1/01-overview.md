# 01 — Overview (1.9.1)

## Vision

Password reset moves from **link-in-email** to **OTP-in-email**: when a user on the core platform (Identity login / forgot-password) requests a reset, Identity generates a **4-digit OTP**, stores it with a **1-minute expiry**, and asks the Email service to deliver a **system template** containing the code. The user enters the OTP in Identity (with a visible countdown); on success they set a new password. Super admins manage the OTP template and view **all** send history from the Email service; company admins see **company-scoped** history and templates only.

## User story

As a platform user who forgot my password, I want to receive a short numeric code by email and enter it within one minute, so I can securely reset my password without clicking a long-lived link.

As a super admin, I want to edit the system password-reset OTP email template and browse all email history, so I can operate platform transactional mail.

As a company admin, I want to see my company's email history and company email templates, so I can manage our branded communications without seeing other tenants' data.

## Goals (1.9.1)

1. **OTP password reset** — 4-digit numeric code; 1-minute TTL; **max 3 wrong attempts** per code; invalidate on use, expiry, or lockout.
2. **Three-step Identity UX** — (1) enter email, (2) enter OTP with countdown, (3) set new password.
3. **Email delivery** — Identity backend calls Email internal API; template `password_reset_otp`; no SMTP in Identity.
4. **Template placeholders** — `userName`, `otp` (and optional body text); super admin editable in Email UI.
5. **Role-scoped admin** — History and Templates lists filtered: super admin = platform/system; company admin = `company_id` scope.
6. **Email platform nav group** — Core left nav **Email** expands to **Email History** and **Templates** (no dashboard redirect).
7. **OTP input control** — UI Kit `OtpInput` with configurable digit boxes; used on Identity verify-reset step.

## Scope (1.9.1)

### In scope

- Identity: `password_reset_otps` storage (or equivalent); APIs for request OTP, verify OTP, complete reset.
- Identity FE: update forgot-password flow; new verify-OTP step; wire reset step after verification.
- Email: seed `password_reset_otp` platform template; ensure History/Templates APIs enforce scope per role.
- UI Kit: `OtpInput` component (default 4 boxes, `length` prop); showcase demo; Identity consumer.
- Deprecate link-based reset for the primary forgot-password path (keep or remove `password_reset` link template per implementation — OTP is the user-facing flow).

### Out of scope (1.9.1)

- SMS OTP or authenticator apps.
- OTP for login (2FA) — reset only.
- Company-specific OTP templates (platform system template only for 1.9.1).
- Resend OTP rate-limit UI beyond generic error handling (optional P1).
- Changes to WebOnOne company lifecycle emails.

## Glossary

| Term | Definition |
|------|------------|
| **OTP** | One-time password — here a **4-digit** numeric code |
| **System email** | Platform-scoped transactional mail (`scope=platform`, no `company_id`) |
| **OTP session** | Short-lived server-side record tying email + verified OTP to allow password change |
| **Countdown** | Client UI timer showing remaining seconds until OTP expiry (1 minute) |

## Success criteria

1. User submits email on forgot-password → receives email with 4-digit OTP within queue SLA.
2. OTP entry screen shows ~60s countdown; expired OTP rejected with clear message.
3. Valid OTP advances to new-password form; invalid OTP shows inline error and remaining attempts (max **3** failures, then must request a new code).
4. Successful reset invalidates OTP; user can sign in with new password.
5. Forgot-password response is generic (no email enumeration).
6. Super admin sees all history rows and platform templates in Email UI.
7. Company admin sees only rows/templates for their company.
8. Super admin can edit `password_reset_otp` template content with `{{userName}}` and `{{otp}}` placeholders.
9. `npm run type-check` passes for `identity-root` and `email-root`.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|----------------|
| Parent — OTP reset + Email history/templates | 86ey3hef6 | All |
| left navigation need to have the sub navigation | 86ey3j67h | [03-email-history-templates.md](./03-email-history-templates.md) |
