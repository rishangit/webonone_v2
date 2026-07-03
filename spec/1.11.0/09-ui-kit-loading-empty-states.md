# 09 — UI Kit loading and empty states (1.11.0 delta)

Shared **`LoadingState`** and **`ListEmptyState`** components in `@webonone/ui-kit`, rollout across service frontends, and cursor rule/skill updates.

Implements ClickUp subtasks **86ey5g5r1** (loading component) and **86ey5g845** (no results component).

---

## Subtask: loading component (`86ey5g5r1`)

**Requirement:** A common loading UI with themed spinner and label text below. Replace ad-hoc `Spinner`-only blocks across services.

### `LoadingState`

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `label` | `string` | `"Loading…"` | Text below spinner |
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | Passed to inner `Spinner` |
| `overlay` | `boolean` | `false` | When `true`, full-viewport centered overlay (preferred for page loads) |
| `className` | `string` | optional | Wrapper classes |

**Inline layout** (`overlay={false}`):

```text
<div role="status" className="flex flex-col items-center justify-center gap-3 py-12">
  <Spinner size={size} />
  <p className="text-sm text-muted-foreground">{label}</p>
</div>
```

**Overlay layout** (`overlay={true}`) — required for page, route, and session loads per subtask:

```text
<div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
  <Spinner size={size} />   ← border-primary (theme accent)
  <p className="text-sm text-muted-foreground">{label}</p>
</div>
```

| Rule | Detail |
|------|--------|
| Theme | Reuse existing `Spinner` (`border-primary border-t-transparent`) |
| Use when | List pages, dashboards, editors, route suspense, session bootstrap |
| Overlay default | Page-level and route-level loads use **`overlay`** — same viewport center; do not embed spinners inside list rows or cards |
| Do not use | Inline button loading — keep `Spinner size="sm"` inside buttons |
| Context labels | Page-specific copy (`"Loading tags…"`, `"Loading dashboard…"`) |

### Rollout targets

Replace `<div className="flex justify-center py-12"><Spinner … /></div>` and equivalent centered spinners in:

| Service | Areas |
|---------|-------|
| **Data** | List pages, editors, dashboard, `LazyRoute`, `PlatformHandoffSpinner`, `AppLayout` session |
| **Email** | History, queue, templates, dashboard, editors, `LazyRoute`, handoff |
| **WebOnOne v2** | `LazyRoute`, settings pages with loading |
| **Media** | `LazyRoute`, folder browser loading |
| **Identity** | `LazyRoute`, auth pages with full-page load |

---

## Subtask: no results component (`86ey5g845`)

**Requirement:** Parameterized empty-list message; reuse instead of bespoke `ItemListEmpty` strings.

### `ListEmptyState`

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `itemType` | `string` | required | Entity label for default message, e.g. `"tags"` → `No tags found.` |
| `message` | `string` | optional | Full override (skips template) |
| `className` | `string` | optional | Extra classes |

**Default message:** `No {itemType} found.` (caller passes plural noun: `"tags"`, `"templates"`, `"companies"`).

Renders centered muted text inside list body (same visual weight as `ItemListEmpty`).

| Rule | Detail |
|------|--------|
| Inside `ItemList` | Return as sole child when `items.length === 0` (replaces `ItemListEmpty` for search/filter empty results) |
| Custom copy | Use `message` when default template does not fit (`"No queue items in this tab."`) |
| Keep `ItemListEmpty` | Low-level primitive; `ListEmptyState` is the preferred app-level API |

### Rollout targets

| Service | Component | `itemType` / `message` |
|---------|-----------|------------------------|
| Data | `TagsList`, `UnitsList`, `AttributesList`, `CatalogList` | tags, units, attributes, products/services/spaces |
| Email | `TemplatesList`, `QueueList`, `HistoryList` | templates, queue items, history entries |
| WebOnOne | `CompaniesList`, `ThemeList` | companies, themes |
| Media | `MediaGrid`, `ScopedFolderBrowser` | media files |

---

## Cursor rules and skills

| File | Action |
|------|--------|
| `.cursor/rules/loading-empty-states.mdc` | **New** — when to use `LoadingState` vs `Spinner`; `ListEmptyState` with `itemType` |
| `.cursor/skills/item-list/SKILL.md` | Checklist bullets |
| `.cursor/rules/README.md` | Index entry |
| `ui-kit/showcase` | Demo both components |

---

## Acceptance

- [ ] `LoadingState` and `ListEmptyState` exported from `@webonone/ui-kit`
- [ ] `LoadingState` supports `overlay` for viewport-centered loading
- [ ] Showcase demonstrates both (inline + overlay)
- [ ] Data, Email, WebOnOne, Media, Identity use `LoadingState overlay` for page/section loads
- [ ] List components use `ListEmptyState` where empty = no results
- [ ] `loading-empty-states.mdc` indexed; item-list skill updated
- [ ] `npm run build -w @webonone/ui-kit` and `npm run type-check` on touched service roots pass

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| need to add the loading component | 86ey5g5r1 | `LoadingState`, rollout |
| need to have the no result found commpn component | 86ey5g845 | `ListEmptyState`, rollout |
