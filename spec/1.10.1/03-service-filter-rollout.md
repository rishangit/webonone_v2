# 03 — Service filter rollout (1.10.1)

Adopt `ListFilterPanel` + `ListFilterTrigger` on every in-scope list page. Remove inline filter forms.

Aligns with pagination inventory from [../1.9.2/04-service-pagination-rollout.md](../1.9.2/04-service-pagination-rollout.md).

---

## Email

| Page | Filters to move into panel | API / notes |
|------|---------------------------|-------------|
| `HistoryPage` | Status, from/to dates (panel); recipient + template name (header `ListSearchField`) | `getHistory` — `search` param matches `recipient`, `template_slug`, or template `name` |
| `QueuePage` | Status (pending/processing/failed) | `listQueue` — replace tab row or duplicate in panel |
| `TemplatesPage` | Search by name/slug (client filter) | Slice before `Pagination` |
| `DashboardPage` | Status + date range on recent activity | `getHistory` subset |

**Keep eager / no panel:**

| Page | Rationale |
|------|-----------|
| Providers | Single card, not collection list |
| Send / Test | Forms, not `ItemList` collections |
| Settings | Config form |

---

## WebOnOne v2

| Page | Filters to add |
|------|----------------|
| `CompaniesPage` | Search company name (client filter on loaded list) |
| `SystemThemePage` | Search theme name (client filter) |

**No panel:**

| Page | Rationale |
|------|-----------|
| Basic Settings | Single company detail |
| Home | Static welcome |

---

## Media

| Surface | Filters |
|---------|---------|
| `ScopedFolderBrowser` (Library) | MIME type, filename search | `listMediaItems` query params if available; else client filter on page slice |

Embed routes (`/picker`, `/upload`) — **no** filter panel (out of scope per embed rules).

---

## Identity

No list pages in 1.10.1 scope.

---

## Layout pattern

```text
FeaturePage
  actions: ListFilterTrigger
  ListFilterPanel (sibling, portal or fixed)
  optional quick filters (only if spec page documents exception)
  ItemList
  Pagination
```

Reset pagination to page 1 when filters change ([item-list-pagination.mdc](../../.cursor/rules/item-list-pagination.mdc)).

---

## Acceptance

- [ ] Email History inline form removed; panel used
- [ ] Email Queue status filter in panel (tabs removed or documented exception)
- [ ] Email Templates + Dashboard recent activity have search/filter panel
- [ ] WebOnOne Companies + System Theme have name search in panel
- [ ] Media library browser has filter panel
- [ ] All pages show active trigger state when filters applied
- [ ] Type-check passes per service root

---

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — every list page | 86ey58rda | This doc |
