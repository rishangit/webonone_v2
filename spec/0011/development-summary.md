# Development summary — Feedback 0011

| Field | Value |
|-------|-------|
| Ticket | `0011` |
| Feedback id | `A6g1nvLnULGL4wKrANxBo` |
| Title | Add tabs for the feedback status |
| Type | `feature` |
| Completed | `2026-10-04` |

## What was delivered

Status tabs on the Support feedback list filter reports by workflow status (All + every status). The filter panel keeps type only. List rows put ticket/status on a header row and title/description on full-width rows below so mobile no longer squeezes text beside the status chip. Help articles (en/si) document the tabs.

## Where to see it

| Surface | Path |
|---------|------|
| Staging Support list | `https://staging-support.webonone.com/feedback` — status tabs above the list |
| Help (en) | `/docs/getting-started/report-feedback` |
| Help (si) | same slug under Sinhala locale |
| Local | `npm run dev:support` → `http://127.0.0.1:3021/feedback` |

## Feature details

- Tabs: **All**, To Do, Ready to Developed, Planned, In Progress, Developed, Staging, Closed.
- Selecting a tab reloads page 1 with that `status` query (All omits status).
- Search and type filter still apply with the active tab.
- Super Admin status menu remains on each row.
- Horizontal tab strip scrolls on narrow screens (UI Kit TabsList).

## Code and docs touched

| Area | Paths |
|------|-------|
| Support FE | `support/frontend/src/features/feedback/pages/FeedbackListPage.tsx` |
| Support FE | `support/frontend/src/features/feedback/components/FeedbackList.tsx` |
| i18n | `support/frontend/src/locales/{en,si}/feedback.json` |
| Help | `support/frontend/src/content/{en,si}/getting-started/report-feedback.md` |
| Spec | `spec/0011/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/support-frontend
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0011: Add tabs for the feedback status` |
| Push | triggers `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
