# Development summary — Feedback 0007

| Field | Value |
|-------|-------|
| Ticket | `0007` |
| Feedback id | `edwTqQTnklsomf3qJHObW` |
| Title | UI Improvements for the Support Feedback List |
| Type | `feature` |
| Completed | `2026-10-04` |

## What was delivered

Support `/feedback` list rows now show a left-aligned Lucide type icon (`Bug` / `Lightbulb`) and pin the workflow status `StatusTag` on the right via `ItemListStatus` (before the Super Admin menu). The inline type text chip was removed; type remains in the row `aria-label`. Help articles (`en` + `si`) describe the new scan layout.

## Where to see it

| Surface | Path |
|---------|------|
| Staging Support | `https://staging-support.webonone.com/feedback` |
| Help (en) | `/docs/getting-started/report-feedback` |
| Help (si) | same slug with locale `si` |
| Local | `npm run dev:support` → `http://127.0.0.1:3021/feedback` |

## Feature details

- Bug rows: red-tinted `Bug` icon on the left.
- Feature rows: primary-tinted `Lightbulb` icon on the left.
- Status chip in `ItemListStatus` (top-right); Super Admin 3-dot status menu remains last.
- Ticket number, title, unread chip, description, screenshot, reporter/date unchanged in content column.

## Code and docs touched

| Root | Paths |
|------|-------|
| `support/` | `frontend/src/features/feedback/components/FeedbackList.tsx` |
| `support/` | `frontend/src/features/feedback/utils/feedbackStatus.ts` |
| `support/` | `frontend/src/content/en/getting-started/report-feedback.md` |
| `support/` | `frontend/src/content/si/getting-started/report-feedback.md` |
| `spec/` | `0007/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit | `307745a1` — `feedback 0007: UI improvements for Support feedback list` |
| Push | success (`origin/deploy_staging`) |
| CI | `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
