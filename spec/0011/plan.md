# Plan — Feedback 0011

## Approach

Use existing Support list query `status` + UI Kit Tabs. Tabs become the primary status control; remove status from `ListFilterPanel`. Restructure `FeedbackList` rows so meta/status sit on one row and title/description occupy a full-width block below. Update help docs.

## Implementation steps

1. **`FeedbackListPage.tsx`**
   - Drive `appliedFilters.status` from a controlled `Tabs` value (`all` | `FeedbackStatus`).
   - Place tabs above `ListPageBody` (or as first child inside body) with `tabsPageClassName` / scrollable `TabsList`.
   - On tab change: update applied status, reset to page 1, reload list.
   - Remove status `Select` from `ListFilterPanel`; `hasActiveFilters` = type only.
   - Keep draft `statusFilter` state removal (or sync tab → applied only).

2. **`FeedbackList.tsx`**
   - Header row: type icon + ticket/unread tags + `ItemListStatus` + optional status menu.
   - Full-width block below: title, description, screenshot, reported-by (button for detail).
   - Prefer wrapping content so title/description never share a horizontal flex sibling with the status chip on narrow screens (e.g. `flex-col` content stack; status in header with `ml-auto`).

3. **i18n** — `en`/`si` `feedback.json`: `statusTabsAria` (and optional short tab labels if needed; reuse `status.*` + `filterAll`).

4. **Help** — `report-feedback.md` en + si: describe status tabs; drop “filter panel … status” wording for status.

5. **Verify** — type-check + lint `@webonone/support-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Many status tabs → rely on UI Kit horizontal scroll on `TabsList`.
- Default tab **All** preserves current “show everything” behavior for non-super-admin users.
