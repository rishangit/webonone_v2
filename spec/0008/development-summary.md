# Development summary — Feedback 0008

| Field | Value |
|-------|-------|
| Ticket | `0008` |
| Feedback id | `5gtsWJRVZiFIC2d40G74T` |
| Title | Improvements for the support feedback list |
| Type | `feature` |
| Completed | `2026-10-04` |

## What was delivered

Support feedback list rows use full-width title and description (no mid-title truncation). Row click opens a routed UI Kit details page at `/feedback/:ticketNumber` with Overview, Comments, and Details cards (replacing the detail dialog). Each workflow status has a distinct `StatusTag` color treatment. List and detail pages poll every 15s while the tab is visible so status updates without a manual refresh. Help article `getting-started/report-feedback` updated in `en` and `si`.

## Where to see it

| Surface | Location |
|---------|----------|
| Staging list | `https://staging-support.webonone.com/feedback` |
| Staging detail | `https://staging-support.webonone.com/feedback/{ticketNumber}` |
| Help | `/docs/getting-started/report-feedback` |
| Local | `npm run dev:support` → `/feedback` |

## Feature details

- Title wraps with `break-words`; description stays `line-clamp-2` across the content column.
- Detail page: Back to list, page-level Edit for reporter/super admin, comments + mark viewed.
- Status colors: muted / primary / info / warning / success fill / success outline (staging) / error.
- Polling pauses when the browser tab is hidden.

## Code and docs touched

| Root | Paths |
|------|-------|
| `support/` | `frontend/src/features/feedback/**`, `frontend/src/app/router.tsx`, locales, help Markdown |
| `spec/0008/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit | `2e93691c` — `feedback 0008: Improvements for the support feedback list` |
| Push | triggers `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
