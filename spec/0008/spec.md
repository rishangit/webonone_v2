# Feedback 0008 — Improvements for the support feedback list

| Field | Value |
|-------|-------|
| Ticket | `0008` |
| Feedback id | `5gtsWJRVZiFIC2d40G74T` |
| Type | `feature` |
| Title | Improvements for the support feedback list |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Improve the Support `/feedback` experience so list rows use full-width title/description, open a dedicated UI-kit details page (not a dialog), show distinctly colored status tags, and keep status (and list data) fresh without a manual refresh while the user stays on the page.

## Problem / goal

Today:

- Title uses `truncate` and shares a wrapping flex row with chips, so title/description do not read as full-width on desktop or mobile.
- Row click opens `FeedbackDetailDialog` (`CustomDialog`) instead of a routed details page.
- Several workflow statuses map to the same `StatusTag` color pairs (`todo`/`staging`/`in_progress` share warning; `ready_to_develop`/`developed` share success), so statuses are hard to scan.
- List/detail status only updates after a manual reload or a local Super Admin status change.

**Goal:** Full-width list copy, routed detail page per UI Kit details cards, distinct status colors, and background refresh while viewing the list or a report.

## Acceptance criteria

1. On `/feedback` list rows, **title** and **description** use the full content column width on mobile and desktop (no title truncation that clips mid-string; description remains readable, e.g. `line-clamp-2` or wrap within the content column).
2. Clicking a feedback row navigates to a **separate detail route** (e.g. `/feedback/:ticketNumber`) that uses **UI Kit** `FeaturePage` + `Card` details layout (Back to list; overview / meta / comments), not `FeedbackDetailDialog` as the primary view.
3. Detail page preserves existing capabilities: view description/screenshot, comments list + add comment, Edit for reporter/super admin (dialog or page action), Super Admin status change still available from list menu.
4. Each workflow **status** tag uses a **visually distinct** color treatment from the others (remap and/or light className overrides on `StatusTag`; prefer existing theme tokens).
5. While the user remains on the feedback **list** or **detail** page, status (and list/detail fields that change with workflow) **update automatically** without a full page refresh (polling the existing list/get APIs on an interval while the document is visible).
6. Help article `getting-started/report-feedback` (`en` + `si`) mentions opening a report’s detail page and that status updates live.
7. `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend` pass.

## Services affected

| Service | Change |
|---------|--------|
| `support/` | Feedback list layout, detail page + route, status colors, polling, help Markdown |
| Backend | No schema change expected — reuse `GET /feedback/:id` and `GET /feedback/ticket/:ticketNumber` |

## Out of scope

- WebSocket / SSE push infrastructure
- New StatusTag variants in `@webonone/ui-kit` unless existing tokens cannot meet distinctness (prefer Support-only mapping first)
- Changing the status workflow enum or Super Admin menu options
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: `/feedback` — full-width title/description; click row → detail page; distinct status colors; leave list open while status changes elsewhere → UI updates without refresh.
