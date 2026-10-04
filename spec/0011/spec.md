# Feedback 0011 — Add tabs for the feedback status

| Field | Value |
|-------|-------|
| Ticket | `0011` |
| Feedback id | `A6g1nvLnULGL4wKrANxBo` |
| Type | `feature` |
| Title | Add tabs for the feedback status |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the Support **Bug and feature reports** list (`/feedback`), add a horizontal status tab strip so users can switch the list to one workflow status at a time. Also fix the mobile list row so title and description sit on their own full-width rows instead of sharing horizontal space with the trailing status chip.

## Problem / goal

Today status filtering is only available via the filter panel `Select`. Scanning by status requires opening the panel. On narrow viewports, `ItemListStatus` sits beside `ItemListContent`, so title/description compete with the status chip and leave unused space on the right of the text block.

**Goal:** Primary status navigation via tabs (each tab loads that status’s tickets). Keep type + search filters. On mobile, title and description use a dedicated full-width row under the ticket/meta + status header.

## Acceptance criteria

1. Feedback list page shows a status tab strip (UI Kit `Tabs` / `TabsList` / `TabsTrigger`) with **All** plus every workflow status: `todo`, `ready_to_develop`, `planned`, `in_progress`, `developed`, `staging`, `closed`.
2. Selecting a tab filters the list to that status (or clears status filter for **All**) via the existing list API/`loadListRequested` query; pagination, search, and type filter still work.
3. Status is no longer duplicated in the filter panel (type-only panel filters; tabs own status).
4. Mobile list rows put **title and description on a separate full-width row** below a header row (ticket/unread + status + menu), so text is not squeezed beside the status chip.
5. Help article `report-feedback` (en + si) documents status tabs instead of (or in addition to) the old status filter-panel control.
6. `npm run type-check` and `npm run lint` pass for the Support frontend workspace.

## Services affected

| Area | Change |
|------|--------|
| `support/frontend` | `FeedbackListPage` tabs; `FeedbackList` mobile row layout; i18n keys |
| `support/frontend/src/content/{en,si}/getting-started/report-feedback.md` | User-facing docs |
| `spec/0011/` | This package |

## Out of scope

- Backend API / schema changes (status query already exists)
- Changing status workflow values or Super Admin status menu
- Counts/badges per tab
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/support-frontend
npm run lint -w @webonone/support-frontend
```

Manual: `/feedback` — switch tabs → list shows only that status; ~375px width — title/description full width under status row.
