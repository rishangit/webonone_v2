# 09 — UI Kit loading and empty states (1.11.0 delta)

Shared **`LoadingState`** and **`ItemListEmpty`** (from `ItemList`) in `@webonone/ui-kit`, rollout across service frontends, and cursor rule/skill updates.

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

**Requirement:** Common empty-list copy via **`ItemListEmpty`** — do not add a separate empty-state component.

### `ItemListEmpty`

Exported from `ItemList.tsx`. Pass message as **children**.

**Layout:**

```text
<p role="status" className="py-4 text-center text-sm text-muted-foreground">{children}</p>
```

| Rule | Detail |
|------|--------|
| Inside lists | Return when `items.length === 0` (before or instead of `ItemList` rows) |
| Default copy | `No {entity} found.` — e.g. `<ItemListEmpty>No tags found.</ItemListEmpty>` |
| Custom copy | Any string as children when default does not fit (`No queue items in this tab.`) |

### Rollout targets

| Service | Component | Example copy |
|---------|-----------|----------------|
| Data | `TagsList`, `UnitsList`, `AttributesList`, `CatalogList` | `No tags found.`, `No units found.`, … |
| Email | `TemplatesList`, `QueueList`, `HistoryList` | `No templates found for your scope.`, … |
| WebOnOne | `CompaniesList`, `ThemeList` | `No companies registered yet.`, `No themes yet.` |
| Media | `ScopedFolderBrowser` | `This folder is empty.` / upload hint |

---

## Cursor rules and skills

| File | Action |
|------|--------|
| `.cursor/rules/loading-empty-states.mdc` | **New** — when to use `LoadingState` vs `Spinner`; `ItemListEmpty` for empty lists |
| `.cursor/skills/item-list/SKILL.md` | Checklist bullets |
| `.cursor/rules/README.md` | Index entry |
| `ui-kit/showcase` | Demo both components |

---

## Acceptance

- [ ] `LoadingState` exported from `@webonone/ui-kit`; `ItemListEmpty` used for empty lists
- [ ] `LoadingState` supports `overlay` for viewport-centered loading
- [ ] Showcase demonstrates `LoadingState` (inline + overlay) and `ItemListEmpty`
- [ ] Data, Email, WebOnOne, Media, Identity use `LoadingState overlay` for page/section loads
- [ ] List components use `ItemListEmpty` where empty = no results
- [ ] `loading-empty-states.mdc` indexed; item-list skill updated
- [ ] `npm run build -w @webonone/ui-kit` and `npm run type-check` on touched service roots pass

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| need to add the loading component | 86ey5g5r1 | `LoadingState`, rollout |
| need to have the no result found commpn component | 86ey5g845 | `ItemListEmpty`, rollout |
