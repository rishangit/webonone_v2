# Feedback 0013 — Attach the spec plan overview file to the ticket

| Field | Value |
|-------|-------|
| Ticket | `0013` |
| Feedback id | `9xOWKIgSv3DqJMvhpPyeF` |
| Type | `feature` |
| Title | Attach the spec plan overview file to the ticket |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the Support **Bug and feature reports** detail page, surface the on-disk `/feedback-fix` planning docs (`spec.md`, `plan.md`, and `development-summary.md` when present) for that ticket so signed-in users can open and read them in the UI. The Support API must read only from the monorepo `spec/{ticket}/` folder with a strict allowlist and the same auth as viewing the report.

## Problem / goal

`/feedback-fix` already writes `spec/{ticketNumber}/spec.md`, `plan.md`, and later `development-summary.md` in the repo. Those files are not linked from the ticket in Support, so reporters and staff cannot open the planning overview from the product UI.

**Goal:** Attach (link) the ticket’s planning Markdown files on the detail page; each file is openable and viewable as rendered Markdown. Viewing is gated by Support feedback auth (JWT), and the backend only serves allowlisted filenames under `spec/{ticket}/` (no path traversal). The app-pool / Node process must be able to read the repo `spec/` directory (default path or `FEEDBACK_SPEC_ROOT`).

## Acceptance criteria

1. Feedback detail (`/feedback/:ticketNumber`) shows a **Planning docs** card listing available files among `spec.md`, `plan.md`, and `development-summary.md` for that ticket (hide missing files; hide the card when none exist).
2. Each listed file is openable and viewable as rendered Markdown on a dedicated route under the same ticket (e.g. `/feedback/:ticketNumber/docs/:fileName`), with Back returning to the detail page.
3. Support API exposes authenticated read endpoints: list available docs + get Markdown body for an allowlisted file name under `spec/{ticket}/` (404 when ticket or file missing; reject `..` / non-allowlisted names).
4. Default filesystem root resolves to monorepo `spec/` from Support backend (local and IIS); optional `FEEDBACK_SPEC_ROOT` override in `backend/.env.example`. Node/IIS identity needs read permission on that folder.
5. Help article `report-feedback` (en + si) mentions that planned/developed tickets may show planning docs on the detail page.
6. `npm run type-check` and `npm run lint` pass for Support frontend; Support backend type-check passes.

## Services affected

| Area | Change |
|------|--------|
| `support/backend` | Spec docs service + routes; env default / `FEEDBACK_SPEC_ROOT` |
| `support/frontend` | Detail card, viewer page, API + store wiring, i18n |
| `support/frontend/src/content/{en,si}/getting-started/report-feedback.md` | Docs |
| `spec/0013/` | This package |

## Out of scope

- Editing or uploading planning docs from the UI
- Serving arbitrary paths under `spec/` (versioned product specs like `1.6.0/`)
- Changing `/feedback-fix` write locations
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run type-check -w @webonone/support-frontend
npm run lint -w @webonone/support-frontend
```

Manual: open a ticket that has `spec/{ticket}/spec.md` (e.g. after this ticket is planned) → Planning docs card → open `spec.md` / `plan.md` → rendered Markdown visible; unauthenticated request to API returns 401.
