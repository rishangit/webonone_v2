# Development summary — Feedback 0013

| Field | Value |
|-------|-------|
| Ticket | `0013` |
| Feedback id | `9xOWKIgSv3DqJMvhpPyeF` |
| Title | Attach the spec plan overview file to the ticket |
| Type | `feature` |
| Completed | 2026-10-04 |

## What was delivered

Signed-in users can open ticket planning Markdown (`spec.md`, `plan.md`, `development-summary.md`) from the Support feedback detail page. The Support API lists and reads only allowlisted files under monorepo `spec/{ticket}/` (optional `FEEDBACK_SPEC_ROOT`), with JWT auth. Help article `report-feedback` (en + si) documents the Planning docs card.

## Where to see it

| Surface | Path |
|---------|------|
| Staging Support | `https://staging-support.webonone.com/feedback/0013` → **Planning docs** → open `spec.md` / `plan.md` |
| Local | `npm run dev:support` → `http://127.0.0.1:3021/feedback/0013` |
| Help | `/docs/getting-started/report-feedback` |

## Feature details

- Detail card lists only files that exist for that ticket; hidden when none.
- Viewer route: `/feedback/:ticketNumber/docs/:fileName` (rendered Markdown via `ArticleBody`).
- API: `GET /api/v1/feedback/ticket/:ticket/spec-docs` and `.../spec-docs/:fileName` (requireAuth).
- Default root: repo `spec/`; IIS app pool needs Read on that folder.

## Code and docs touched

| Area | Paths |
|------|-------|
| Support BE | `feedbackSpec.service.ts`, routes/controller/schemas, `env.ts`, `.env.example` |
| Support FE | detail page, `FeedbackSpecDocPage`, router, feedback API/slice/epics, i18n |
| Help | `content/{en,si}/getting-started/report-feedback.md` |
| Rules | `.cursor/rules/support-project.mdc` |
| Spec | `spec/0013/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run type-check -w @webonone/support-frontend
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0013: attach spec plan docs to ticket` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
