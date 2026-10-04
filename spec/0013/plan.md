# Plan — Feedback 0013

## Approach

Serve ticket planning Markdown from the monorepo `spec/{ticket}/` folder via authenticated Support API. Surface links on the feedback detail page and render with the existing `ArticleBody` Markdown component. Strict allowlist: `spec.md`, `plan.md`, `development-summary.md`.

## Implementation steps

1. **Backend env** — Optional `FEEDBACK_SPEC_ROOT` (absolute path). Default: `path.resolve(backendRoot, '../../spec')` (works for `support/backend` local and `support/deploy` IIS when `backendRoot` is the staged deploy dir → repo `spec/`). Document in `.env.example`.

2. **`feedbackSpec.service.ts`**
   - Allowlist file names + display keys.
   - Resolve ticket folder with regex `^\d{4}$` + `path.resolve` + ensure resolved path stays under spec root.
   - `listSpecDocs(ticket)` → existing files with `{ fileName, labelKey }`.
   - `readSpecDoc(ticket, fileName)` → `{ fileName, markdown }` or `NOT_FOUND`.

3. **Routes / controller** (before `/:id` conflicts — use ticket paths):
   - `GET /feedback/ticket/:ticketNumber/spec-docs` → list
   - `GET /feedback/ticket/:ticketNumber/spec-docs/:fileName` → body
   - Auth: `requireAuth` (signed-in viewers; same as comments). Optionally allow automation key via `requireFeedbackAutomationOrJwt` for MCP — prefer `requireAuth` only for UI docs.

4. **Frontend API + store**
   - `feedbackApi.listSpecDocs` / `getSpecDoc`.
   - Slice fields + epics for list (with detail) and doc fetch (viewer page).

5. **UI**
   - Detail page: Planning docs `Card` with link buttons per available file.
   - New page `FeedbackSpecDocPage` at `/feedback/:ticketNumber/docs/:fileName` — `FeaturePage` + `ArticleBody`.
   - Router lazy route; i18n en/si keys.

6. **Help** — `report-feedback.md` en + si: planning docs on detail when present.

7. **Verify** — type-check support-root + frontend; lint frontend.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- IIS app pool must have **Read** on repo `spec/` (same as reading other repo files; document in `.env.example` / IIS note if needed).
- Tickets without a `spec/{ticket}/` folder show no card — expected until `/feedback-fix` runs.
- Do not copy `spec/` into `deploy/` — read from monorepo path so staging `git pull` makes new docs available without re-staging Support.
