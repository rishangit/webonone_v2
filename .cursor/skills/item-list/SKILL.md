---
name: item-list
description: >-
  Builds vertical item lists with uniform row padding, small gaps between rows,
  glass-card row surfaces (light translucent --glass-bg + blur), small themed
  box-shadow on hover, and a per-item three-dot overflow menu for row actions
  using @webonone/ui-kit ItemList primitives and DropdownMenu. Use when creating
  or editing item lists, list rows, collection lists, resource lists, settings
  lists, selectable rows, overflow menus, kebab menus, or three-dot menus on
  list items in any service frontend.
---

# Item list

Standard workflow for **vertical lists of entities** (themes, files, users, settings rows, etc.). Rows are **separate glass cards** with a small gap between them. Each row uses **`glass-card`** (light translucent `--glass-bg`, backdrop blur). Hover adds a **small box shadow** tinted with `--accent-primary` — **no border color change** and no background fill. **Row-specific actions live in the 3-dot menu**, not as inline buttons.

## When to apply

- Adding or editing a list of items in a feature (`*List.tsx`, `*Items.tsx`)
- Moving edit/delete/duplicate actions off inline buttons into an overflow menu
- Ensuring consistent list row spacing and hover across services
- Adding a new `@webonone/ui-kit` list section in showcase

## UI Kit primitives (required)

Import from `@webonone/ui-kit`:

| Export | Role |
|--------|------|
| `ItemList` | `<ul>` with `gap-2` between rows and **`py-4`** vertical padding |
| `ItemListItem` | Single row — `glass-card item-list-row`, `px-3 py-2`, themed shadow on hover |
| `ItemListContent` | Main label/metadata (`flex-1`, truncates) |
| `ItemListMenu` | Vertical 3-dot trigger (`MoreVertical`) at **top-right** of row |
| `ItemListEmpty` | Empty list copy — centered `py-4 text-center text-muted-foreground`; pass message as children |
| `itemListRowActiveClassName` | Active/selected row — `border-primary` (border only, no fill) |
| `itemListMenuClassName` | Menu trigger — `shrink-0 self-start` (pins to top-right; row uses `items-start`) |
| `DropdownMenuItem`, `DropdownMenuSeparator`, … | Menu entries inside `ItemListMenu` |

**Do not** hand-roll row padding, gap, glass, or hover classes. Use `ItemListItem` (or `itemListRowClassName` only when composing a custom layout inside a row).

If primitives are missing or need API changes, update **`ui-kit/package` first** (ui-kit-agent scope), build, then use in the service.

## Row actions rule

| Do | Don't |
|----|-------|
| Put Edit, Duplicate, Delete, Apply, etc. in `ItemListMenu` | Scatter `Button` actions across the row |
| Use `DropdownMenuItem` with `onClick` / `asChild` links | Duplicate menu markup per list |
| Destructive last, after `DropdownMenuSeparator` | Inline destructive buttons on every row |
| `ariaLabel={`Actions for ${item.name}`}` on `ItemListMenu` | Generic "menu" with no context |

Primary row click (select, navigate, toggle) may stay on the row body — only **secondary actions** go in the menu.

For **single-select user pickers** in a modal (search + infinite scroll, no 3-dot menu), use **`UserSelectionDialog`** from `@webonone/ui-kit` instead of hand-rolling `ItemList` inside `CustomDialog`. See `ui-kit/package/src/components/UserSelectionDialog.tsx` and spec `1.9.3`.

## File layout

```text
<service>/
  frontend/src/features/<module>/
    components/<Entity>List.tsx
```

- One list component per entity collection
- Props: `items`, selection/active callbacks, action handlers (`onEdit`, `onDelete`, …)
- Empty array → `ItemListEmpty` (not an empty `<ul>`)

## Workflow

1. **Guard** — `const rows = Array.isArray(items) ? items : []`; early return with `ItemListEmpty` when `rows.length === 0`.
2. **Structure** — `ItemList` → map → `ItemListItem` per entity.
3. **Content** — `ItemListContent` for title, subtitle, badges, thumbnails (left side).
4. **Menu** — `ItemListMenu` as the **last** child of `ItemListItem` (renders top-right via `items-start` on the row + `self-start` on the trigger). Menu items call parent handlers.
5. **Destructive** — `DropdownMenuItem className="text-destructive focus:text-destructive"`.
6. **Selection** — highlight active row with `itemListRowActiveClassName` (`border-primary`) on `ItemListItem`. **Never** add `bg-accent`, `bg-primary`, `bg-background`, or palette fills on top of the glass row.

## Visual tokens (mandatory)

| Concern | Token / class |
|---------|----------------|
| List container (`<ul>`) | `itemListClassName` — `flex flex-col gap-2` **`py-4`** |
| Gap between rows | `gap-2` on `ItemList` |
| Row surface | `glass-card` — `hsl(var(--glass-bg))` + `backdrop-filter: blur(8px)` |
| Row hover | `item-list-row:hover` → `box-shadow: 0 2px 8px hsl(var(--accent-primary) / 0.22)` — **shadow only**, no border or background change |
| Row layout | `ItemListItem` uses `flex items-start` — content left, menu top-right |
| Menu trigger | `itemListMenuClassName` — `self-start shrink-0` on 3-dot button |
| Row padding | `px-3 py-2` (via `ItemListItem`) |
| Row border (default) | `--glass-border` via `glass-card`; border color stays on hover |
| Active / selected row | `itemListRowActiveClassName` → `border-primary` |
| Empty copy | `text-muted-foreground` (via `ItemListEmpty`) |
| Menu panel | `DropdownMenuContent` defaults (`bg-popover`, `border-border`) |

**Forbidden on list rows:** `hover:border-primary`, `hover:bg-*`, `bg-accent`, `bg-primary`, `glass-card-elevate` (too large), or any accent/palette background fill.

Dynamic content swatches (e.g. theme color previews) may use inline `backgroundColor` from API data.

## Accessibility

- `ItemList` sets `role="list"`.
- `ItemListMenu` trigger must have a descriptive `ariaLabel` per row.
- Menu items are keyboard-reachable via Radix `DropdownMenu`.
- If the row is clickable, use a `<button>` inside `ItemListContent` or an explicit `onClick` with clear focus styles — do not nest interactive elements incorrectly.

## Checklist

- [ ] Uses `ItemList`, `ItemListItem`, `ItemListContent`, `ItemListMenu`
- [ ] Row actions in 3-dot menu, not inline button groups
- [ ] `ItemList` uses default `py-4` on the `<ul>` — do not override with `py-0` unless embed layout requires it
- [ ] `gap-2` between rows; same padding on every row
- [ ] Row surface is `glass-card item-list-row` — no extra `bg-*` on rows
- [ ] Hover is themed shadow only (`item-list-row`); no `hover:border-*` or `hover:bg-*`
- [ ] Active state uses `border-primary` only
- [ ] Empty state via **`ItemListEmpty`** with explicit copy as children
- [ ] Page/section fetch loading via **`LoadingState`** with contextual `label` — not centered `Spinner size="lg"` blocks
- [ ] `ItemListMenu` is last child of `ItemListItem` — 3-dot trigger at top-right
- [ ] Destructive action last in menu with destructive styling
- [ ] Per-row `ariaLabel` on `ItemListMenu`
- [ ] `@/` imports in service frontends ([code-cleanliness.mdc](../../rules/code-cleanliness.mdc))
- [ ] Paginated collections use `Pagination` below the list — default `pageSize` **12**, options `[12, 24, 48]` ([item-list-pagination.mdc](../../rules/item-list-pagination.mdc))
- [ ] Paginated pages wrap list + pagination in `ListPageBody`; list in `flex-1`; `Pagination` has `className="mt-auto"`
- [ ] Filterable collections use `ListFilterTrigger` + `ListFilterPanel` ([list-filter-panel.mdc](../../rules/list-filter-panel.mdc))
- [ ] Page loads use `LoadingState overlay`; empty results use `ItemListEmpty`

## Rules

Cross-link only — do not duplicate:

- [tailwind-css.mdc](../../rules/tailwind-css.mdc) — theme tokens, no inline styles
- [react-typescript.mdc](../../rules/react-typescript.mdc) — components, a11y
- [front-end-structure.mdc](../../rules/front-end-structure.mdc) — feature folders
- [ui-kit-project.mdc](../../rules/ui-kit-project.mdc) — build and export workflow
- [item-list-pagination.mdc](../../rules/item-list-pagination.mdc) — `Pagination` with `ItemList`
- [list-filter-panel.mdc](../../rules/list-filter-panel.mdc) — `ListFilterPanel` on collection pages
- [loading-empty-states.mdc](../../rules/loading-empty-states.mdc) — `LoadingState` vs button `Spinner`; `ItemListEmpty`
- [form-creation skill](../form-creation/SKILL.md) — when the list is inside a form (orthogonal)

## Examples

Full copy-paste templates: [examples.md](examples.md)

## Verification

**UI Kit** (when changing `ItemList` or exports):

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

**Service frontend** (from that service's `frontend/` directory):

```bash
npm run type-check
npm run lint
```

**Manual**

- Visible **`py-4`** padding on the list `<ul>` above and below rows
- Visible small gap between each row
- Row shows frosted glass surface
- Hover any row → small shadow tinted with active theme accent; border unchanged
- Active row → `border-primary` without extra background fill
- 3-dot menu sits at the **top-right** of each row (not vertically centered)
- Tab to 3-dot trigger → menu opens; Escape closes
- All rows align; padding matches other lists in the app
