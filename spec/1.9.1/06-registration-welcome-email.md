# 06 — Registration welcome email and success UX (1.9.1)

After a user completes the four-step registration wizard, Identity sends a **welcome** transactional email via the Email service and shows a clear **success** screen. Registration step forms use consistent vertical spacing.

## Requirements

| Requirement | Detail |
|-------------|--------|
| Welcome email | On successful `completeRegistration`, call Email internal API with template slug **`welcome`** |
| Template payload | `{ userName }` — user's display name (first + last) |
| Send pattern | Same as other Identity → Email sends (`sendTransactionalEmail`, fire-and-forget; log failures, do not fail registration) |
| Success UI | Replace minimal "Account created" text with prominent success message at end of wizard |
| Form spacing | Registration wizard steps use consistent `space-y-6` (or equivalent) between fields and actions |

## Backend

In `completeRegistration` (`auth.service.ts`), after `createUser`:

```typescript
void sendTransactionalEmail({
  templateSlug: 'welcome',
  toEmail: user.email,
  payload: { userName: displayName },
  requestedByService: 'identity',
}).catch((err) => {
  console.error('[auth] failed to send welcome email:', err)
})
```

No new Email migration — `welcome` template seeded in [1.9.0](../1.9.0/03-sending-engine.md).

## Frontend

| File | Change |
|------|--------|
| `RegisterPage.tsx` | Success state: `AuthLayout` title "Registration successful"; `Alert` with confirmation copy + welcome email note; link to sign in |
| `RegisterEmailStep.tsx` | `Form className="space-y-6"` |
| `RegisterVerifyOtpStep.tsx` | `Form className="space-y-6"` |
| `RegisterProfileStep.tsx` | `Form className="space-y-6"` |
| `RegisterPasswordStep.tsx` | `Form className="space-y-6"` |

### Success copy (example)

- Title: **Registration successful**
- Body: "Your account has been created. We've sent a welcome email to **{email}**. You can sign in now."

## Acceptance

- [ ] Welcome email queued after registration completes (visible in Email history)
- [ ] Registration API still returns 201 if email send fails (logged server-side)
- [ ] Success screen shown after step 4 submit succeeds
- [ ] Wizard forms have consistent vertical spacing
- [ ] `npm run type-check -w identity-root` passes

## ClickUp

Subtask **86ey3tdg4** — need to send the registration completed welcome email.
