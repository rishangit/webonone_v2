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
| Parent: [User Story] Spec No 1.9.1 | 86ey3hef6 | All |
| (no subtasks) | — | Phases 1–4 map to parent scope |

---

## Acceptance checklist

- [ ] 4-digit OTP emailed via Email service
- [ ] 1-minute OTP expiry enforced server-side
- [ ] OTP UI countdown and expiry messaging
- [ ] Password reset after valid OTP
- [ ] `password_reset_otp` template seeded and super-admin editable
- [ ] Super admin: all history + platform templates
- [ ] Company admin: company-scoped history + templates only
- [ ] No email enumeration on forgot-password
- [ ] `npm run type-check -w identity-root` and `email-root` pass

---

## Final verification commands

```bash
npm run migrate -w identity-root
npm run migrate -w email-root
npm run type-check -w identity-root
npm run type-check -w email-root
npm run dev:identity
npm run dev:email
```
