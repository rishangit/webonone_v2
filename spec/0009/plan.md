# Plan — Feedback 0009

## Approach

Remove the leftover super-admin Email Templates control from Support `FeedbackListPage` and delete the i18n/helper wiring that exists only for that button. No backend or Email service changes.

## Implementation steps

1. **`FeedbackListPage.tsx`**
   - Remove the `isSuperAdmin` conditional `Button` + `<a href={getEmailAppUrl('/templates')}>` block from `FeaturePage` `actions`.
   - Drop unused imports: `Button`, `getEmailAppUrl` (keep `isSessionSuperAdmin` — still used for `FeedbackList`).

2. **Locales**
   - Remove `emailTemplateLink` from `support/frontend/src/locales/en/feedback.json` and `si/feedback.json`.

3. **Dead email helper (if unused after step 1)**
   - Delete `support/frontend/src/features/email/utils/emailConfig.ts` and empty `features/email` folders.
   - Remove `VITE_EMAIL_ORIGIN` from `support/frontend/.env.example` if it only served this link.

4. **Verify**
   - `npm run type-check -w support-root`
   - `npm run lint -w @webonone/support-frontend`

5. **Phase C**
   - Write `development-summary.md`, one commit `feedback 0009: …`, push `deploy_staging`, status `staging`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Comment notification emails are unchanged (backend already uses Email API + `feedback_comment`).
- Do not remove Email help docs under `content/**/communications/email-templates.md` — those describe the product Email feature, not this list button.
