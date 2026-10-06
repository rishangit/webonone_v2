# Plan — Feedback 0008

## Approach

Support frontend feature work only (reuse existing GET-by-id / GET-by-ticket APIs). Replace dialog-first detail with a routed details page; polish list row width and status colors; add visibility-aware polling on list and detail.

## Implementation steps

1. **List row width** — `FeedbackList.tsx`
  - Stack ticket chip + unread chip above or beside title without `truncate` on the title (allow wrap: `break-words` / `whitespace-normal`).
  - Keep description in the full `ItemListContent` width (`min-w-0 w-full`); keep `line-clamp-2`.
  - Row primary action: `navigate` to `/feedback/${ticketNumber}` (pass `onOpenDetail` as navigate or use `useNavigate` in list).

2. **Detail page** — add `FeedbackDetailPage.tsx`
  - Route `feedback/:ticketNumber` in `router.tsx` (lazy, `PrivateRoute`).
  - Follow details-page-cards: `FeaturePage` `onBack` → `/feedback`; left stack (Overview description + screenshot, Comments); right stack (Status, type, reporter, dates).
  - Load via new `feedbackApi.getByTicket` → epic/slice `fetchDetailRequested` (or reuse list item + force get).
  - Port comment load/create + mark-viewed + edit dialog from `FeedbackDetailDialog`.
  - Remove list-page use of `FeedbackDetailDialog` (delete dialog file if unused).

3. **Status colors** — `feedbackStatus.ts`
  - Remap each of the 7 statuses to a unique visual treatment using `StatusTag` variants + optional `className` for the one that would otherwise collide (e.g. staging outline vs developed fill).
  - Export helper used by list and detail.

4. **Live refresh** — list + detail pages
  - While mounted and `document.visibilityState === 'visible'`, poll every ~15s: list → `loadListRequested` with current filters/`force`; detail → get-by-ticket/`force`.
  - Pause when tab hidden; clear interval on unmount.
  - Keep Redux as source of truth so Super Admin status changes still update immediately.

5. **API / store**
  - Add `feedbackApi.get(id)` / `getByTicket(ticketNumber)`.
  - Slice + epic for detail fetch; sync detail into `items` when present; detail page selects by ticket.

6. **Help** — update `en`/`si` `getting-started/report-feedback.md` (click opens detail page; status refreshes while viewing).

7. **Verify** type-check + lint on Support workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before editing Support FE | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Ticket route must not clash with `/feedback` create flows; keep list at exact `feedback`.
- Polling must not reset scroll/filters; use same page/pageSize/query and merge by id.
- Do not open detail as dialog when embedded or standalone — always navigate.
