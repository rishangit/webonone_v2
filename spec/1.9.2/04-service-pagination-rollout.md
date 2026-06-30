# 04 — Service pagination rollout (1.9.2)

Adopt `@webonone/ui-kit` **`Pagination`** on every service list backed by server or client paging. Add agent guidance in `.cursor/rules/` and cross-link the item-list skill.

## Server-paginated APIs (wire `total` from API)

| Service | Page | API | Notes |
|---------|------|-----|-------|
| Email | `HistoryPage` | `getHistory` | Full history with filters |
| Email | `QueuePage` | `listQueue` | Tab filter preserved on page change |
| Email | `DashboardPage` | `getHistory` | Recent activity list (stats cards stay on `getDashboardStats`) |
| Media | `ScopedFolderBrowser` | `listMediaItems` | Media files per folder; folders from current path |

## Client-paginated lists (slice in page; `totalCount = items.length`)

| Service | Page | List component |
|---------|------|----------------|
| Email | `TemplatesPage` | `TemplatesList` |
| Email | `TemplateEditorPage` | Version history `ItemList` |
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

## Audit — Email service

| Surface | Pagination | Rationale |
|---------|------------|-----------|
| History | Yes — server | Primary audit trail |
| Queue | Yes — server | Large job backlog |
| Templates list | Yes — client | All templates loaded once |
| Template editor versions | Yes — client | Version list can grow |
| Dashboard recent activity | Yes — server (`getHistory`) | Replaces fixed 10-row snapshot from stats |
| Dashboard stat cards | No | Aggregate counts only |
| Providers | No | Single SMTP card |
| Send / Test | No | Form + template picker, not collection list |

## Audit — WebOnOne v2 (core app)

| Surface | Pagination | Rationale |
|---------|------------|-----------|
| Companies (super admin) | Yes — client | `CompaniesList` |
| System Theme list | Yes — client | `ThemeList` |
| Basic Settings | No | Single company detail |
| Home | No | Static welcome |

## Out of scope

- Identity (no item lists in 1.9.2)
- Template picker dropdowns on Send page (not `ItemList` collections)

## Acceptance

- [ ] Email Queue, Templates, Dashboard recent activity use `Pagination`
- [ ] Email Template editor version history uses client `Pagination`
- [ ] Media folder browser paginates media items via API
- [ ] `item-list-pagination.mdc` indexed; item-list skill updated
- [ ] Type-check passes for `ui-kit-root`, `email-root`, `webonone-v2-root`, `media-root`

## ClickUp

Subtask **86ey3ykth** — Implement the pagination to the services.
