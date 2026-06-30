# 02 — UI Kit Pagination component (1.9.2)

Reusable list pagination for `@webonone/ui-kit`. Parent components own data fetching, filters, and sort; `Pagination` renders navigation UI and invokes callbacks.

## Requirements (from ClickUp)

| Requirement | Detail |
|-------------|--------|
| Props | `totalCount`, `currentPage` (1-based), `pageSize`, `onPageChange(page)` |
| Navigation | First, previous, next, last, individual page numbers; current page highlighted |
| Summary | “Showing {start}–{end} of {total}” |
| Page sizes | User-selectable 12, 24, 48 (configurable list) via `onPageSizeChange` |
| Filters/sort | Preserved by parent — pagination only changes page/size callbacks |
| Single page | Hide controls when one page or no records (`hideWhenSinglePage`, default `true`) |
| Responsive | Stack or wrap on narrow viewports; limit visible page buttons with ellipsis |
| Styling | UI Kit `Button`, `Select`; `text-muted-foreground` for summary |
| Edge cases | `totalCount === 0`; `currentPage` > total pages — parent should clamp; component may clamp display |

## Component API

```typescript
export interface PaginationProps {
  /** Total records across all pages */
  totalCount: number
  /** Current page, 1-based */
  currentPage: number
  /** Records per page */
  pageSize: number
  /** Called when user selects a page (1-based) */
  onPageChange: (page: number) => void
  /** When set, shows page-size selector */
  onPageSizeChange?: (pageSize: number) => void
  /** Options for page-size dropdown; default [12, 24, 48] */
  pageSizeOptions?: number[]
  /** Default options when omitted: [12, 24, 48] */
  /** Hide bar when total pages ≤ 1; default true */
  hideWhenSinglePage?: boolean
  /** Max page number buttons before ellipsis; default 5 */
  siblingCount?: number
  className?: string
  id?: string
}
```

Export `Pagination` and `PaginationProps` from `ui-kit/package/src/index.ts`.

## Behavior

### Page count

`totalPages = Math.max(1, Math.ceil(totalCount / pageSize))` for range math; when `totalCount === 0`, show summary “Showing 0 of 0” and hide nav if `hideWhenSinglePage`.

### Record range

```text
start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
end   = Math.min(currentPage * pageSize, totalCount)
```

Display: `Showing {start}–{end} of {totalCount}`.

### Page number window

Render page buttons around `currentPage` with ellipsis (`…`) when `totalPages > siblingCount + 2`. Always show page 1 and last page when truncated.

### Buttons

| Control | `onPageChange` | Disabled when |
|---------|----------------|---------------|
| First | `1` | `currentPage <= 1` |
| Previous | `currentPage - 1` | `currentPage <= 1` |
| Next | `currentPage + 1` | `currentPage >= totalPages` |
| Last | `totalPages` | `currentPage >= totalPages` |
| Page N | `N` | `N === currentPage` (active state, not disabled) |

Use `Button` `variant="outline"` for controls; `variant="default"` or distinct `aria-current="page"` for active page.

### Accessibility

- Nav landmark: `<nav aria-label="Pagination">`.
- Icon-only first/last: `aria-label` (“First page”, “Last page”).
- Page size `Select` labeled “Rows per page”.

## Files

| Path | Change |
|------|--------|
| `ui-kit/package/src/components/Pagination.tsx` | **New** |
| `ui-kit/package/src/index.ts` | Export |
| `ui-kit/showcase/src/pages/ControlsPage.tsx` | Demo — default + page-size variant |
| `email/frontend/src/features/history/pages/HistoryPage.tsx` | Replace inline prev/next with `Pagination` |

## Styling

- Layout: `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Summary: `text-sm text-muted-foreground`.
- Page buttons: `size="sm"` or `h-9 min-w-9` for number cells.
- Mobile: allow horizontal scroll for page numbers (`overflow-x-auto`) if needed.

## Acceptance

- [ ] `Pagination` exported from UI Kit
- [ ] Showcase demonstrates pagination with `totalCount={156}`, page size selector
- [ ] Email History uses `Pagination`; filter form unchanged across page changes
- [ ] Single-page list hides pagination bar
- [ ] Zero results shows summary without broken controls
- [ ] `npm run type-check -w ui-kit-root` and `email-root` pass

## ClickUp

Subtask **86ey3yjxz** — Define the pagination.
