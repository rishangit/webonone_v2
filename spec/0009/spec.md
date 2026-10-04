# Feedback 0009 — Remove the Email Templates button from the Support Feedback Lists page

| Field | Value |
|-------|-------|
| Ticket | `0009` |
| Feedback id | `gSJz5rox9SLNfxgU9KGdL` |
| Type | `bug` |
| Title | Remove the Email Templates button from the Support Feedback Lists page |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The Support Feedback Lists page (`/feedback`) shows a super-admin **Email templates** outline button that links to the Email app. That control is leftover UI and must be removed so the list header only has search, filters, and Report issue.

## Problem / goal

On `FeedbackListPage`, when the signed-in user is a super admin, the page actions include:

```tsx
<Button variant="outline" … asChild>
  <a href={getEmailAppUrl('/templates')}>{t('emailTemplateLink')}</a>
</Button>
```

Feedback comment emails already use the Email service’s platform template (`feedback_comment`) configured in Email → Templates. Operators do not need a deep-link button on the Support feedback list.

**Goal:** Remove the Email Templates button (and unused wiring) from the Support Feedback Lists page.

## Acceptance criteria

1. Super admin on Support `/feedback` no longer sees an **Email templates** (or equivalent) button in the page header/actions.
2. Non–super-admin list UI is unchanged (search, filter, Report issue remain).
3. Unused `emailTemplateLink` i18n keys and the feedback-list-only `getEmailAppUrl` import / `features/email` helper are removed if nothing else references them.
4. Feedback list, create, status update, and detail/comment flows still work.
5. `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend` pass.

## Services affected

| Area | Change |
|------|--------|
| `support/frontend` | Remove button + dead imports/keys from `FeedbackListPage` |
| `spec/0009/` | This package |

## Out of scope

- Changing Email Templates in the Email service
- Changing feedback comment notification backend / `feedback_comment` slug
- Support help article rewrites (no docs currently describe this button on `/feedback`)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: sign in as super admin → Support `/feedback` → header has Search, filter, Report issue only (no Email templates).
