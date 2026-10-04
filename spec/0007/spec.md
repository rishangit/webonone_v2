# Feedback 0007 — UI Improvements for the Support Feedback List

| Field | Value |
|-------|-------|
| Ticket | `0007` |
| Feedback id | `edwTqQTnklsomf3qJHObW` |
| Type | `feature` |
| Title | UI Improvements for the Support Feedback List |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The Support feedback list (`/feedback`) should make report type and workflow status easier to scan: type shown with a left-aligned icon, status chip pinned to the right of each row.

## Problem / goal

Today each row packs ticket number, title, type `StatusTag`, status `StatusTag`, and optional unread chip in one wrapping flex row. Status does not use `ItemListStatus`, so it does not sit at the top-right. Type is text-only (no bug/feature icon).

**Goal:** Match standard ItemList patterns — leading type icon on the left; status tag in `ItemListStatus` on the right (before the Super Admin 3-dot menu).

## Acceptance criteria

1. Each feedback row shows a Lucide icon for type on the **left** (`Bug` for bug, `Lightbulb` for feature request), with accessible labeling (aria / visible type text as appropriate).
2. The workflow **status** `StatusTag` is aligned to the **right** via `ItemListStatus` (before `ItemListMenu` when present).
3. Ticket number, title, description, screenshot thumb, reporter/date, and unread-comments chip remain readable; type text chip may be removed if the icon + aria convey type.
4. Layout works for signed-in users (no menu) and Super Admin (status menu still last on the row).
5. Light update to `getting-started/report-feedback` help (`en` + `si`) if list scanning copy mentions type/status layout.
6. `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend` pass.

## Services affected

| Service | Change |
|---------|--------|
| `support/` | `FeedbackList.tsx` row layout; optional help Markdown |

## Out of scope

- Backend / API / status workflow changes
- Filter panel or create/edit dialog redesign
- UI Kit primitive API changes (use existing `ItemListStatus`)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: open `/feedback` — icons left, status right; Super Admin menu still works.
