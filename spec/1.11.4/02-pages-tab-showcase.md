# 02 — Pages tab showcase (1.11.4)

ClickUp: **Need to have the pages tab in the UI kits show case** (`86ey9pkzn`)

## Problem

Showcase **Components** demos list primitives in isolation. Consumers still dig through Email/Data/WebOnOne source to see the **full page** pattern. `ListPageBody` is exported and used in services but not shown as a complete list page in the showcase.

## Solution

Add a **Pages** top-level tab with nested **List page** and **Details page** demos that compose kit exports end-to-end.

## Navigation registration

Follow existing hash-tab pattern:

| Step | File | Change |
|------|------|--------|
| 1 | `ui-kit/showcase/src/components/showcase-nav.ts` | Add `{ id: 'pages', label: 'Pages' }` to `ShowcaseTab` / `SHOWCASE_TABS` |
| 2 | `ui-kit/showcase/src/pages/ShowcaseApp.tsx` | Import page; `<Tabs.Content value="pages">` |
| 3 | `ui-kit/showcase/src/pages/PagesPage.tsx` | Host nested List / Details UI |

**Nested tabs:** Radix Tabs inside `PagesPage` with values `list` and `details`. Prefer hash support when practical (e.g. `#pages` + nested state, or `#pages-list` / `#pages-details` via extended `parseShowcaseTab`). Unknown nested value → List page default.

Do **not** introduce React Router subpaths for demos unless `App.tsx` is intentionally changed — current showcase is a single catch-all route.

## List page demo — “all possible items”

Compose the **standard list screen** documented by item-list / pagination / filter rules:

```text
FeaturePage (title, description, actions)
  actions: ListSearchField + ListFilterTrigger (+ any primary Button e.g. “Add”)
  ListFilterPanel (when filter open)
  ListPageBody
    ItemList → ItemListItem → ItemListContent + ItemListMenu
    (optional) ItemListEmpty when mock filter yields zero rows
    Pagination (mt-auto; pageSize 12; pageSizeOptions [12, 24, 48])
```

### Required building blocks

| Kit export | Demo requirement |
|------------|------------------|
| `FeaturePage` | Title, description, `actions` slot |
| `ListSearchField` | Controlled search string filters mock rows |
| `ListFilterTrigger` / `ListFilterPanel` | At least one filter control that changes the list |
| `ListPageBody` | Wraps list + pagination column |
| `ItemList` / `ItemListItem` / `ItemListContent` | ≥ 3 mock rows; glass rows |
| `ItemListMenu` + `DropdownMenuItem` | Edit / Delete (Delete destructive + separator) |
| `itemListRowActiveClassName` | One selectable/active row |
| `ItemListEmpty` | Toggle or filter path that shows empty state |
| `Pagination` | Parent-owned `currentPage` / `pageSize`; enough mock rows to paginate |

### Behavioral notes

- Mock data only (in-memory array).
- Pagination slices the filtered list client-side.
- Changing search/filter resets to page 1 when appropriate.
- Match production defaults: `pageSize` **12**, options **`[12, 24, 48]`**.

## Details page demo — “all possible items”

Compose a **details / editor** page using `FeaturePage` and the form/control set services already use. There is no dedicated `DetailPage` layout in the kit — the pattern is FeaturePage + form body.

### Required building blocks (representative set)

| Kit export / pattern | Demo requirement |
|----------------------|------------------|
| `FeaturePage` | Title, description, actions (Save / Cancel or equivalent) |
| `Form` / `FormField` | At least one labeled field group with required asterisk if using form skill patterns |
| Text inputs | Include common controls already in showcase Components where available: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Button` |
| Optional extras if exported | `OTPInput`, tags/chips, date-like fields — include if they are first-class kit exports used on editors; otherwise skip rather than invent |
| Validation style | Show at least one inline field error state (static or Zod) for the pattern |

### Layout notes

- Single column form inside FeaturePage content — readable, not a marketing layout.
- Prefer `@webonone/ui-kit` only; no copying service feature stores.
- Label the demo so readers know this is the **editor/details** template for consumers.

## Components tab relationship

| Keep on Components | Prefer on Pages |
|--------------------|-----------------|
| Isolated primitive API demos (props/variants) | Full-page compositions |
| Layout shells (AppShell) if already there | List + Details page recipes |

Do not remove Components list demos in 1.11.4 unless they become redundant noise and the Pages demos are complete.

## Acceptance (subtask)

- [ ] Pages appears in showcase top nav; `#pages` works
- [ ] Nested List page and Details page tabs work
- [ ] List page shows search, filters, ItemList (menu, active, empty), ListPageBody, Pagination
- [ ] Details page shows FeaturePage + form controls representing editor pages
- [ ] `npm run type-check -w ui-kit-root` passes
- [ ] `npm run build -w @webonone/ui-kit` still succeeds (no package break)

## Out of scope (this doc)

- Replacing production pages
- Cursor rule updates (optional follow-up if agents should point at Pages tab)
- New package layouts such as `DetailPage` unless implementation discovers a clear shared shell gap
