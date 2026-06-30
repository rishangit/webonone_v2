# 01 — Overview (1.9.2)

## Vision

Platform list screens (Email History, future admin tables) need consistent pagination: first/previous/next/last, numbered pages, a record-range summary, and optional page-size selection. A single UI Kit component owns layout, accessibility, and theme tokens so consumers only wire `totalCount`, `currentPage`, `pageSize`, and callbacks.

## User story

As a developer using the UI kit, I want a reusable pagination component, so that I can consistently display and navigate through large lists across different parts of my app.

## Goals (1.9.2)

1. **`Pagination` component** — controlled props for `totalCount`, `currentPage`, `pageSize`, `onPageChange`, optional `onPageSizeChange`.
2. **Full navigation bar** — first, previous, next, last, and individual page numbers with current page highlighted.
3. **Record summary** — “Showing 21–40 of 156” (or empty-state copy when `totalCount === 0`).
4. **Page size selector** — optional dropdown (e.g. 10, 25, 50) when `onPageSizeChange` is provided.
5. **Single-page UX** — hide or disable controls when only one page exists.
6. **Responsive** — usable on desktop and mobile (compact page list on narrow viewports).
7. **Theme-aligned** — colors, spacing, typography per UI Kit design tokens (`Button`, `Select`).
8. **Edge cases** — out-of-range `currentPage`, zero results, clamping page numbers.
9. **Showcase demo** — Controls or Components tab documents all variants.
10. **Reference consumer** — Email `HistoryPage` adopts `Pagination` (filters/sort preserved by parent state — component does not own fetch logic).

## Scope (1.9.2)

### In scope

- `ui-kit/package/src/components/Pagination.tsx` + export from `index.ts`.
- Showcase demo section.
- Email `HistoryPage` migration from inline Previous/Next to `Pagination`.
- Optional `pageSizeOptions` prop (default `[10, 25, 50]`).

### Out of scope (1.9.2)

- Server-side pagination APIs (consumers already pass `totalCount`).
- Infinite scroll or cursor-based pagination.
- Migrating every list in WebOnOne/Media/Identity (Email History is the reference only).
- URL query sync (parent responsibility when needed).

## Glossary

| Term | Definition |
|------|------------|
| **Controlled pagination** | Parent owns `currentPage` / `pageSize` and refetches or slices data on change |
| **Page window** | Subset of page numbers rendered around `currentPage` (ellipsis for gaps) |
| **Record range** | Inclusive start–end indices for items on the current page |

## Success criteria

1. `Pagination` exported from `@webonone/ui-kit` with documented props.
2. Clicking first/prev/next/last and a page number calls `onPageChange` with the target page (1-based).
3. Summary shows correct range for arbitrary `totalCount`, `pageSize`, `currentPage`.
4. Page size change calls `onPageSizeChange`; parent resets to page 1 when appropriate.
5. Controls hidden when `totalCount === 0` or total pages ≤ 1 (configurable via `hideWhenSinglePage`, default `true`).
6. Email History uses `Pagination`; filters unchanged when changing page.
7. `npm run type-check -w ui-kit-root` and `email-root` pass.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|----------------|
| Parent — pagination UI Kit | 86ey3yh8p | All |
| Define the pagination | 86ey3yjxz | [02-ui-kit-pagination.md](./02-ui-kit-pagination.md) |
