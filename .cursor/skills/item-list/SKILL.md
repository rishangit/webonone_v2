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
| `ItemListItem` | Single row — `glass-card item-list-row`, `p-2`, themed shadow on hover |
| `ItemListContent` | Main label/metadata (`flex-1`, truncates) |
| `ItemListStatus` | Trailing status/verification chip at **top-right**, before `ItemListMenu` |
| `ItemListMenu` | Vertical 3-dot trigger (`MoreVertical`) at **top-right** of row |
| `ItemListEmpty` | Empty list copy — centered `py-4 text-center text-muted-foreground`; pass message as children |
| `itemListRowActiveClassName` | Active/selected row — `border-primary` (border only, no fill) |
| `itemListMenuClassName` | Menu trigger — `shrink-0 self-start` (pins to top-right; row uses `items-start`) |
| `itemListThumbClassName` | Leading `ImagePreview` — `h-14 w-14 shrink-0 self-start rounded-md` |
| `itemListRowBodyClassName` | Image + text inside `ItemListContent` — `flex w-full items-start gap-3` |
| `itemListStatusClassName` | Status chip slot — `shrink-0 self-start` (same top-right pin as menu) |
| `DropdownMenuItem`, `DropdownMenuSeparator`, … | Menu entries inside `ItemListMenu` |

**Do not** hand-roll row padding, gap, glass, or hover classes. Use `ItemListItem` (or `itemListRowClassName` only when composing a custom layout inside a row).

If primitives are missing or need API changes, update **`ui-kit/package` first** (ui-kit-agent scope), build, then use in the service.

## List page composition (collection routes)

For paginated collection **pages** (not embed pickers), compose:

`FeaturePage` → optional `ListFilterPanel` → `ListPageBody` → `ItemList` / `ItemListEmpty` → `ListPageFooter className="mt-auto"`.

Header `actions` (in order): **`SearchInput`** + `ListFilterTrigger` + **`ListAddButton`**. Never use plain `Input` for text search ([ui-kit-consumption.mdc](../../rules/ui-kit-consumption.mdc)). When `description` is set, `PageHeader` renders title, wrapping description, then actions on their own row. Below `sm`, tap the search icon to expand the field leftward across that row. Loading via `usePlatformLoading` — not inline `"Loading…"` in `ItemListEmpty`.

**Primary CTA (`ListAddButton`):** last in `actions`, permission-gated. Pass the full label as children (e.g. `Add tag`). The Plus icon is built in. Below `sm` the button shows **+ Add** until tapped, then grows left (`duration-300 ease-out`, same as header search) and pushes search/filter left; the second tap runs `onClick`. Opening search or tapping outside collapses add. Optional `compactLabel` for i18n (default `Add`). Do **not** hand-roll `Button` + `Plus` for list-page create.

```tsx
<ListAddButton onClick={() => setDialog({})}>Add tag</ListAddButton>
```

Canonical demo: `ui-kit/showcase/src/pages/pages/PageDemos.tsx` (`ListPageDemo`). Rule: [feature-page-layout.mdc](../../rules/feature-page-layout.mdc).

## ItemList inside a Card

When a **section card** on a details or settings page wraps an `ItemList` (stocks, workflow steps, attribute values, POS cart, etc.), avoid double glass surfaces and wasted horizontal space:

| Piece | Rule |
|-------|------|
| Outer card | `Card variant="list"` — transparent, no border/bg/shadow |
| Header | `CardHeader` is flush horizontally (`px-0` via variant context); vertical padding unchanged |
| Body | `CardContent` is flush horizontally (`px-0` via variant context) |
| List | `ItemList className="py-0"` — no extra vertical padding inside the card |

`EditableSectionCard` wrappers accept `variant="list"` and forward it to `Card`.

```tsx
<Card variant="list">
  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
    <CardTitle className="text-lg">Stock batches</CardTitle>
    {/* optional Add button */}
  </CardHeader>
  <CardContent>
    <ItemList className="py-0">
      {items.map((item) => (
        <ItemListItem key={item.id}>…</ItemListItem>
      ))}
    </ItemList>
  </CardContent>
</Card>
```

Showcase: `ui-kit/showcase/src/pages/ComponentsPage.tsx` (Item lists section). Reference: `ProductVariantStocksCard.tsx`, `CompanyServiceWorkflowTab.tsx`.

Do **not** use `variant="list"` on read-only field cards, stat cards, or gallery/overview cards that do not contain an `ItemList`.

## Row actions rule

| Do | Don't |
|----|-------|
| Put Edit, Duplicate, Delete, Apply, etc. in `ItemListMenu` | Scatter `Button` actions across the row |
| Use `DropdownMenuItem` with `onClick` / `asChild` links | Duplicate menu markup per list |
| Destructive last, after `DropdownMenuSeparator` | Inline destructive buttons on every row |
| `ariaLabel={`Actions for ${item.name}`}` on `ItemListMenu` | Generic "menu" with no context |

Primary row click (select, navigate, toggle) may stay on the row body — only **secondary actions** go in the menu.

For **single-select user pickers** in a modal (search + infinite scroll, no 3-dot menu), use **`UserSelectionDialog`** from `@webonone/ui-kit` instead of hand-rolling `ItemList` inside `CustomDialog`. See `ui-kit/package/src/components/UserSelectionDialog.tsx`.

For **single-select service pickers**, use **`ServiceSelectionDialog`** the same way (injected `loadServices` — company catalog or Data library). See `ui-kit/package/src/components/ServiceSelectionDialog.tsx` and WebOnOne `createCompanyCatalogServicesLoader` / `createDataLibraryServicesLoader`.

## Detail page navigation

When the entity has a details / profile route ([details-page-cards skill](../details-page-cards/SKILL.md)), **row body click must open that page**. Do not rely on the 3-dot menu alone for open.

| When | Required behavior |
|------|-------------------|
| Entity has a details/profile route | Row body click **must** `navigate` (or call `onOpen` that navigates) to that route |
| No detail page (apply / select / toggle-only lists) | Row click may select or toggle; keep existing behavior |

**Pattern** (canonical: `MyCompaniesList`, `CompaniesList`):

```tsx
<ItemListContent>
  <button
    type="button"
    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    onClick={() => navigate(`/settings/companies/${id}`)}
  >
    {/* title, subtitle, ImagePreview, StatusTag */}
  </button>
</ItemListContent>
```

- Put the navigable `<button>` **inside** `ItemListContent` — never put `onClick` on `ItemListItem` (`<li>`) when the row also has `ItemListMenu` (nested interactive elements).
- Optional: duplicate **View details** as a `DropdownMenuItem` in the menu; Edit / Delete / Approve stay menu-only.
- Do not open the detail page only from the menu when a detail route exists.

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
3. **Content** — `ItemListContent` for title, subtitle, badges, thumbnails (left side). Entity logos/avatars use **`ImagePreview`** (`src={item.logoUrl}`; `src={null}` shows the kit first-upload icon — never a custom “No logo” tile). Size list thumbs with `className="h-10 w-10 rounded-md"`. See [image-preview.mdc](../../rules/image-preview.mdc). **Dates in subtitles** → [date-display skill](../date-display/SKILL.md) (`Oct 10, 2026`).
4. **Detail open** — if a details/profile route exists, wrap row content in a `<button>` that navigates (or calls `onOpen`). See **Detail page navigation**.
5. **Status** — verification/status chips in `ItemListStatus` as the **last child before** `ItemListMenu` (top-right, left of the 3-dot trigger).
6. **Menu** — `ItemListMenu` as the **last** child of `ItemListItem` (renders top-right via `items-start` on the row + `self-start` on the trigger). Menu items call parent handlers.
6. **Destructive** — `DropdownMenuItem className="text-destructive focus:text-destructive"`.
7. **Selection** — highlight active row with `itemListRowActiveClassName` (`border-primary`) on `ItemListItem`. **Never** add `bg-accent`, `bg-primary`, `bg-background`, or palette fills on top of the glass row. In **selection / picker dialogs**, also show Lucide `Check` on the right of every selected row — [selection-dialog-list.mdc](../../rules/selection-dialog-list.mdc) (canonical: `TagPickerPanel`).

## Visual tokens (mandatory)

| Concern | Token / class |
|---------|----------------|
| List container (`<ul>`) | `itemListClassName` — `flex flex-col gap-2` **`py-4`** (use `py-0` inside `Card variant="list"` or embed bodies) |
| Gap between rows | `gap-2` on `ItemList` |
| Row surface | `glass-card` — `hsl(var(--glass-bg))` + `backdrop-filter: blur(8px)` |
| Row hover | `item-list-row:hover` → `box-shadow: 0 2px 8px hsl(var(--accent-primary) / 0.22)` — **shadow only**, no border or background change |
| Row layout | `ItemListItem` uses `flex items-start` — content left, menu top-right; leading images use `self-start` on `itemListThumbClassName` |
| Menu trigger | `itemListMenuClassName` — `self-start shrink-0` on 3-dot button |
| Row padding | `p-2` (via `ItemListItem`) |
| Row border (default) | `--glass-border` via `glass-card`; border color stays on hover |
| Active / selected row | `itemListRowActiveClassName` → `border-primary` |
| Selection dialog selected | `border-primary` **+** Lucide `Check` rightmost (`ml-auto h-5 w-5 text-primary`) — [selection-dialog-list.mdc](../../rules/selection-dialog-list.mdc) |
| Empty copy | `text-muted-foreground` (via `ItemListEmpty`) |
| Menu panel | `DropdownMenuContent` defaults (`bg-popover`, `border-border`) |

**Forbidden on list rows:** `hover:border-primary`, `hover:bg-*`, `bg-accent`, `bg-primary`, `glass-card-elevate` (too large), or any accent/palette background fill.

Dynamic content swatches (e.g. theme color previews) may use inline `backgroundColor` from API data.

## Accessibility

- `ItemList` sets `role="list"`.
- `ItemListMenu` trigger must have a descriptive `ariaLabel` per row.
- Menu items are keyboard-reachable via Radix `DropdownMenu`.
- If the row is clickable (including detail navigation), use a `<button>` inside `ItemListContent` with clear focus styles (`focus-visible:ring-2 focus-visible:ring-ring`). Do **not** put `onClick` on the `<li>` (`ItemListItem`) when the row also has `ItemListMenu` — that nests interactive controls incorrectly.

## Checklist

- [ ] Uses `ItemList`, `ItemListItem`, `ItemListContent`, `ItemListMenu`
- [ ] Row actions in 3-dot menu, not inline button groups
- [ ] Detail route exists → row body click opens it (button inside `ItemListContent`); menu may duplicate View details — do not open details from the menu alone
- [ ] `ItemList` uses default `py-4` on standalone collection pages — use `className="py-0"` when nested in `Card variant="list"` or embed/dialog bodies
- [ ] `gap-2` between rows; same padding on every row
- [ ] Row surface is `glass-card item-list-row` — no extra `bg-*` on rows
- [ ] Hover is themed shadow only (`item-list-row`); no `hover:border-*` or `hover:bg-*`
- [ ] Active state uses `border-primary` only
- [ ] Selection / picker dialogs: selected rows also show Lucide `Check` on the right ([selection-dialog-list.mdc](../../rules/selection-dialog-list.mdc))
- [ ] Empty state via **`ItemListEmpty`** with explicit copy as children
- [ ] Page/section fetch loading via **`usePlatformLoading('Loading …')`** — not inline text or per-page `LoadingState overlay`
- [ ] Verification/status chips in `ItemListStatus` before `ItemListMenu` — top-right of row
- [ ] `ItemListMenu` is last child of `ItemListItem` — 3-dot trigger at top-right
- [ ] Destructive action last in menu with destructive styling
- [ ] Per-row `ariaLabel` on `ItemListMenu`
- [ ] `@/` imports in service frontends ([code-cleanliness.mdc](../../rules/code-cleanliness.mdc))
- [ ] Date subtitles use [date-display skill](../date-display/SKILL.md) (`Oct 10, 2026`)
- [ ] Paginated collections use `ListPageFooter` below the list — default `pageSize` **12**, options `[12, 24, 48]` ([item-list-pagination.mdc](../../rules/item-list-pagination.mdc))
- [ ] Paginated pages wrap list + footer in `ListPageBody`; list in `flex-1`; `ListPageFooter` has `className="mt-auto"`
- [ ] Filterable collections use `ListFilterTrigger` + `ListFilterPanel` ([list-filter-panel.mdc](../../rules/list-filter-panel.mdc))
- [ ] Primary CTA is **`ListAddButton`** (full label as children, last in header `actions`, permission-gated) — not a raw `Button` + `Plus`
- [ ] Page loads use **`usePlatformLoading`** (AppLayout owns the overlay); empty results use `ItemListEmpty`

## Rules

Cross-link only — do not duplicate:

- [tailwind-css.mdc](../../rules/tailwind-css.mdc) — theme tokens, no inline styles
- [react-typescript.mdc](../../rules/react-typescript.mdc) — components, a11y
- [front-end-structure.mdc](../../rules/front-end-structure.mdc) — feature folders
- [ui-kit-project.mdc](../../rules/ui-kit-project.mdc) — build and export workflow
- [item-list-pagination.mdc](../../rules/item-list-pagination.mdc) — `ListPageFooter` with `ItemList`
- [list-filter-panel.mdc](../../rules/list-filter-panel.mdc) — `ListFilterPanel` on collection pages
- [loading-empty-states.mdc](../../rules/loading-empty-states.mdc) — unified platform overlay; `usePlatformLoading`; button `Spinner`
- [details-page-cards skill](../details-page-cards/SKILL.md) — when row click opens a details/profile page
- [form-creation skill](../form-creation/SKILL.md) — when the list is inside a form (orthogonal)
- [date-display skill](../date-display/SKILL.md) — date subtitles and metadata
- [selection-dialog-list.mdc](../../rules/selection-dialog-list.mdc) — picker/selection dialogs: Check icon on selected rows

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
- When a detail route exists: click row body → detail page; 3-dot menu still works without navigating
- All rows align; padding matches other lists in the app
