# 07 — Implementation Plan

Phased delivery for **1.9.1** on branch **`spec/1.9.1`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.9.1
```

| Rule | Detail |
|------|--------|
| Base branch | `master` (includes merged `spec/1.9.0`) |
| Spec branch | `spec/1.9.1` |
| Scope | `identity/`, `email/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.9.1/*` documentation
- [ ] Branch `spec/1.9.1`

---

## Phase 1 — Email template and API scope

**Goal:** OTP template seed; History/Templates scope verified or hardened.

| Task | Detail |
|------|--------|
| Migration/seed | `password_reset_otp` platform template |
| Template editor | Placeholder docs for `userName`, `otp` |
| History API | Super admin all; company admin `company_id` filter |
| Templates API | Super admin platform; company admin company scope |
| Manual test | Internal send with sample OTP payload |

**Exit criteria:** Super admin edits OTP template; history lists OTP sends.

---

## Phase 2 — Identity OTP backend

**Goal:** Store, send, verify OTP; reset session.

| Task | Detail |
|------|--------|
| Migration | OTP + reset session tables |
| `requestPasswordReset` | 4-digit OTP, 1-min expiry, Email internal send |
| `verifyResetOtp` | Validate + issue reset session |
| `resetPassword` | Accept `resetSessionToken` |
| Env | `EMAIL_API_BASE_URL`, `EMAIL_SERVICE_API_KEY` (existing) |

**Exit criteria:** API tests or manual Postman flow for three endpoints.

---

## Phase 3 — Identity OTP frontend

**Goal:** Three-step UX with countdown.

| Task | Priority |
|------|----------|
| `VerifyResetOtpPage` + route | P0 |
| Update ForgotPassword copy/navigation | P0 |
| Countdown timer (60s) | P0 |
| ResetPassword session token wiring | P0 |
| Embed redirect query preservation | P0 |
| "Resend code" link back to forgot-password | P1 |

**Exit criteria:** End-to-end reset in browser; embed mode smoke test.

---

## Phase 5 — Email platform nav sub-menus

**Goal:** Email group in core left nav with **Email History** and **Templates** sub-items; no dashboard redirect.

| Task | Detail |
|------|--------|
| `platform-nav` | Email `group` with `externalPath` `/history` and `/templates` |
| WebOnOne + Identity | `onClick` per sub-item → auth-code redirect to target path |
| Email FE | Rewrite core nav email URLs to local routes; bootstrap on `/history` and `/templates` |
| Remove | Single **Email** item that opened dashboard `/` |

**Exit criteria:** Super admin and company admin open History or Templates from core nav without visiting dashboard.

Spec: [03-email-history-templates.md](./03-email-history-templates.md) — subtask **86ey3j67h**

---

## Phase 6 — UI Kit OTP input control

**Goal:** Shared multi-box OTP entry; showcase demo; Identity verify-reset consumer.

| Task | Detail |
|------|--------|
| `OtpInput` component | `ui-kit/package/src/components/OtpInput.tsx` — `length` prop (default 4) |
| Export | `ui-kit/package/src/index.ts` |
| Showcase | `ui-kit/showcase/src/pages/ControlsPage.tsx` — OTP input section |
| Identity consumer | `VerifyResetOtpPage.tsx` — replace single `Input` with `OtpInput` |

**Exit criteria:** 4-digit OTP entry works with paste/backspace; type-check ui-kit + identity.

Spec: [04-ui-kit-otp-input.md](./04-ui-kit-otp-input.md) — subtask **86ey3rq8b**

---

## Phase 7 — Registration email OTP wizard

**Goal:** Four-step registration; email OTP before account creation.

| Task | Detail |
|------|--------|
| Migration | `registration_email_otps`, `registration_sessions` |
| Email template | `email_verification_otp` seed in Email service |
| APIs | `request-email-otp`, `verify-email-otp`, `register/complete` |
| FE wizard | `RegisterPage` + step components; `OtpInput` on step 2 |
| Remove | Single-shot `POST /auth/register` |

**Exit criteria:** E2E registration with OTP; user `is_email_verified: true`.

Spec: [05-identity-registration-otp.md](./05-identity-registration-otp.md) — subtask **86ey3t18g**

---

## Phase 8 — Registration welcome email and success UX

**Goal:** Send `welcome` email after registration; polish wizard spacing; success screen.

| Task | Detail |
|------|--------|
| `completeRegistration` | Call Email internal API — template `welcome`, payload `{ userName }` |
| `RegisterPage.tsx` | Success `Alert` + title; mention welcome email sent |
| Wizard steps | `Form className="space-y-6"` on all four step components |

**Exit criteria:** Welcome email in history; success UI after step 4; type-check passes.

Spec: [06-registration-welcome-email.md](./06-registration-welcome-email.md) — subtask **86ey3tdg4**

---

## Phase 4 — Integration verification

| Task | Detail |
|------|--------|
| E2E | Forgot password → email → OTP → new password → login |
| Role UI | Super admin vs company admin History/Templates |
| Security | No OTP in logs/URLs; generic forgot response |
| Type-check | identity-root, email-root |

**Exit criteria:** Acceptance checklist below passes.

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.9.1 | 86ey3hef6 | Phases 1–4 |
| left navigation need to have the sub navigation | 86ey3j67h | Phase 5 |
| need to have the control for OTP | 86ey3rq8b | Phase 6 |
| need to email virification for the user regitration | 86ey3t18g | Phase 7 |
| need to send the regiration completed welcome email | 86ey3tdg4 | Phase 8 |

---

## Acceptance checklist

- [ ] 4-digit OTP emailed via Email service
- [ ] 1-minute OTP expiry enforced server-side
- [ ] OTP UI countdown and expiry messaging
- [ ] Max **3** wrong OTP attempts per code; locked out until new forgot-password request
- [ ] Password reset after valid OTP
- [ ] `password_reset_otp` template seeded and super-admin editable
- [ ] Super admin: all history + platform templates
- [ ] Company admin: company-scoped history + templates only
- [ ] Core nav **Email** group opens **Email History** or **Templates** (not dashboard)
- [ ] `OtpInput` on Identity verify-reset step; showcased in UI Kit Controls tab
- [ ] Four-step registration with email OTP; account created verified
- [ ] Welcome email sent after registration (`welcome` template)
- [ ] Registration success screen with clear confirmation message
- [ ] No email enumeration on forgot-password
- [ ] `npm run type-check -w identity-root` and `email-root` pass

---

## Final verification commands

```bash
npm run migrate -w identity-root
npm run migrate -w email-root
npm run type-check -w identity-root
npm run type-check -w email-root
npm run type-check -w ui-kit-root
npm run dev:identity
npm run dev:email
```
