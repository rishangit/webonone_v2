# Development summary — Feedback 0009

| Field | Value |
|-------|-------|
| Ticket | `0009` |
| Feedback id | `gSJz5rox9SLNfxgU9KGdL` |
| Title | Remove the Email Templates button from the Support Feedback Lists page |
| Type | `bug` |
| Completed | `2026-10-04` |

## What was delivered

Removed the super-admin **Email templates** outline button from Support Feedback Lists (`/feedback`). Search, filter, and Report issue remain. Unused `emailTemplateLink` i18n keys, the `features/email` URL helper, and Support frontend `VITE_EMAIL_ORIGIN` wiring were deleted. Feedback comment emails still use the Email service platform template (`feedback_comment`) via the backend.

## Where to see it

| Surface | How |
|---------|-----|
| Staging Support | Open Support feedback list → header actions: search, filter, Report issue only (no Email templates), even as super admin |
| Local | `npm run dev:support` → `/feedback` as super admin |
| Help docs | No Support article change (button was never documented on `/feedback`) |

## Feature details

- Button removed for all roles (it previously showed only for super admin).
- Email Templates in the Email app are unchanged; edit `feedback_comment` there as before.
- No Support API or migration changes.

## Code and docs touched

| Root | Paths |
|------|-------|
| `support/frontend` | `features/feedback/pages/FeedbackListPage.tsx`, `locales/en|si/feedback.json`, `.env.example`; deleted `features/email/` |
| `tooling` | `apply-production-env.mjs` (drop Support FE `VITE_EMAIL_ORIGIN`) |
| `spec/0009/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Both passed.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0009: remove Email Templates button from Support feedback list` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
