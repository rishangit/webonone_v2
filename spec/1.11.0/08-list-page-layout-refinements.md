# 08 — List page layout refinements (1.11.0 delta)

Post-build UX fixes for Data admin list pages. Implements ClickUp subtasks **86ey5g15b** (pagination position) and **86ey5g1t4** (search + filter header alignment).

Inherits patterns from [../1.10.1/02-ui-kit-list-filter-panel.md](../1.10.1/02-ui-kit-list-filter-panel.md) and [../1.9.2/04-service-pagination-rollout.md](../1.9.2/04-service-pagination-rollout.md).

---

## Subtask: pagination position (`86ey5g15b`)

**Requirement:** Pagination must stay at the **bottom of the page** even when the list has few rows. Controls align to the bottom of the viewport content area, not directly under the last row.

### Layout contract

```text
FeaturePage
  actions (search + filter + create)
  ListFilterPanel
  ListPageBody                    ← min-h-[calc(100dvh-13rem)] flex flex-col gap-6
    <div className="flex-1">      ← list grows; empty space above pagination
      ItemList | Spinner
    </div>
    <Pagination className="mt-auto" … />
```

| Rule | Detail |
|------|--------|
| `ListPageBody` | Required wrapper from `@webonone/ui-kit` |
| List wrapper | `flex-1` div around list or loading spinner |
| `Pagination` | Sibling below list wrapper; **`className="mt-auto"`** |
| Few rows | Pagination still pins to bottom of `ListPageBody` min-height |

### Scope

| Service | Pages |
|---------|-------|
| **Data** | Tags, Units, Attributes, Products, Services, Spaces list pages |

### Rules / skills update

| File | Action |
|------|--------|
| `.cursor/rules/item-list-pagination.mdc` | Confirm bottom-pin pattern with `flex-1` + `mt-auto` example |
| `.cursor/skills/item-list/SKILL.md` | Checklist bullet: paginated pages use `ListPageBody` + `mt-auto` |

---

## Subtask: search and filter align right (`86ey5g1t4`)

**Requirement:** Search and filter controls sit in **one row**, **right-aligned** in the page header. Text search uses `ListSearchField` — not a full-width field above the list.

### Header layout

```tsx
<FeaturePage
  title="…"
  actions={
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      {canMutate ? <Button asChild><Link to="…">Create …</Link></Button> : null}
      <ListSearchField value={q} onChange={setQ} placeholder="…" />
      <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
    </div>
  }
>
```

| Rule | Detail |
|------|--------|
| Row | `ListSearchField` immediately **before** `ListFilterTrigger` in the same flex row |
| Alignment | `justify-end` on the actions wrapper — search + filter always on the right |
| Create button | May precede search in the same row (still right-aligned as a group) |
| Forbidden | `ListSearchField` as a full-width sibling between `FeaturePage` header and `ListPageBody` |
| Mobile | Rely on `PageHeader` `justify-end` on mobile (UI Kit) |

### Scope

| Service | Pages |
|---------|-------|
| **Data** | All six entity list pages (`TagsPage`, `UnitsPage`, `AttributesPage`, `CatalogListPage` for products/services/spaces) |

Reference: `email/frontend/src/features/history/pages/HistoryPage.tsx`.

### Rules / skills update

| File | Action |
|------|--------|
| `.cursor/rules/list-filter-panel.mdc` | Add `justify-end` on actions wrapper; forbid body-placed search |
| `.cursor/skills/item-list/SKILL.md` | Checklist: search + filter in `actions`, right-aligned |

---

## Acceptance

- [ ] Data list pages: `ListSearchField` + `ListFilterTrigger` in `FeaturePage` `actions`, right-aligned
- [ ] No standalone `ListSearchField` between header and list body on Data pages
- [ ] Pagination uses `className="mt-auto"` inside `ListPageBody` with list in `flex-1` wrapper
- [ ] Pagination visible at page bottom with 1–2 list rows
- [ ] `item-list-pagination.mdc` and `list-filter-panel.mdc` updated
- [ ] `item-list` skill checklist updated
- [ ] `npm run type-check -w data-root` passes

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| pagination position | 86ey5g15b | Pagination bottom pin |
| search button and the filter button align to right | 86ey5g1t4 | Header search + filter row |
