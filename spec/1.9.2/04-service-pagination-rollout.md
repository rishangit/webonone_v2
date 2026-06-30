# 04 — Service pagination rollout (1.9.2)

Adopt `@webonone/ui-kit` **`Pagination`** on every service list backed by server or client paging. Add agent guidance in `.cursor/rules/` and cross-link the item-list skill.

## Server-paginated APIs (wire `total` from API)

| Service | Page | API | Notes |
|---------|------|-----|-------|
| Email | `HistoryPage` | `getHistory` | Done in Phase 2 |
| Email | `QueuePage` | `listQueue` | Pass `page`, `pageSize`; preserve tab filter on page change |
| Media | `ScopedFolderBrowser` | `listMediaItems` | Paginate media files; folders always from current path |

## Client-paginated lists (slice in page; `totalCount = items.length`)

| Service | Page | List component |
|---------|------|----------------|
| Email | `TemplatesPage` | `TemplatesList` |
| WebOnOne v2 | `CompaniesPage` | `CompaniesList` |
| WebOnOne v2 | `SystemThemePage` | `ThemeList` |

Parent owns `page` / `pageSize` state; passes sliced array to list child; `Pagination` below list inside `FeaturePage`.

## Cursor rules

| File | Action |
|------|--------|
| `.cursor/rules/item-list-pagination.mdc` | **New** — when to use `Pagination` with `ItemList`; server vs client patterns |
| `.cursor/skills/item-list/SKILL.md` | Cross-link pagination rule; checklist bullet |
| `.cursor/rules/README.md` | Index new rule |

## Layout pattern

```text
FeaturePage
  …filters / actions…
  ItemList (current page rows only)
  Pagination (totalCount, currentPage, pageSize, callbacks)
```

Place `Pagination` **below** the list with `gap-6` from `FeaturePage` body spacing. Reset to page 1 when filters or tab change.

## Out of scope

- Dashboard widgets showing a fixed recent subset (Email dashboard)
- Template version history on editor (small list)
- Identity (no item lists in 1.9.2)

## Acceptance

- [ ] Email Queue uses `Pagination`
- [ ] Email Templates, WebOnOne Companies, WebOnOne Themes use client-side `Pagination`
- [ ] Media folder browser paginates media items via API
- [ ] `item-list-pagination.mdc` indexed; item-list skill updated
- [ ] Type-check passes for `ui-kit-root`, `email-root`, `webonone-v2-root`, `media-root`

## ClickUp

Subtask **86ey3ykth** — Implement the pagination to the services.
