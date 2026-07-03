# 02 — UI Kit list filter panel

Reusable right-side filter panel and header trigger for collection pages inside `FeaturePage`.

Reference layouts: `FeaturePage` `actions` prop ([../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md)).

---

## Components

### `ListFilterTrigger`

Icon button placed in `FeaturePage` `actions`.

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `active` | `boolean` | required | When true, icon uses accent/highlight styles |
| `onClick` | `() => void` | required | Toggle panel open |
| `aria-label` | `string` | `"Filters"` | Accessibility |
| `className` | `string` | optional | Extra classes |

**Behavior:**

- Renders a `Button` `variant="outline"` `size="icon"` with filter/sliders icon (`lucide-react` `SlidersHorizontal` or `Filter`).
- When `active` is true: add `border-primary text-primary` (or existing themed active token).
- Does not own panel state — parent coordinates `open` + `active`.

### `ListFilterPanel`

Right-side slide-over panel for filter fields.

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `open` | `boolean` | required | Panel visibility |
| `onOpenChange` | `(open: boolean) => void` | required | Close on overlay click / Escape |
| `title` | `string` | `"Filters"` | Panel heading |
| `children` | `ReactNode` | required | Filter fields (`FormField`, `Select`, `DatePicker`, etc.) |
| `onApply` | `() => void` | optional | Primary apply action |
| `onClear` | `() => void` | optional | Reset all filters to defaults |
| `className` | `string` | optional | Panel content wrapper |

**Layout contract:**

```text
[Backdrop overlay — fixed inset-0 z-40, click closes]
[Panel — fixed right-0 top-0 h-full w-full max-w-sm z-50]
  glass-card border-l flex flex-col
  Header: title + close button
  Body: scrollable children (gap-4 p-4)
  Footer: Clear + Apply buttons (sticky bottom)
```

**Motion:**

- Enter: `translate-x-full` → `translate-x-0` with `transition-transform duration-200`.
- Exit: reverse. Use `cn()` + conditional classes; no new animation dependency.

**Accessibility:**

- `role="dialog"` `aria-modal="true"` on panel when open.
- Escape key closes panel (same pattern as `AppSidebar` mobile overlay).
- Focus trap optional for v1 — at minimum restore focus to trigger on close.

---

## Integration pattern (consumer page)

```tsx
<FeaturePage
  title="History"
  actions={
  <ListFilterTrigger
    active={hasActiveFilters}
    onClick={() => setFilterOpen(true)}
  />
  }
>
  <ListFilterPanel
    open={filterOpen}
    onOpenChange={setFilterOpen}
    onApply={handleApplyFilters}
    onClear={handleClearFilters}
  >
    {/* FormField + Select + DatePicker … */}
  </ListFilterPanel>

  <ItemList>…</ItemList>
  <Pagination … />
</FeaturePage>
```

| Rule | Detail |
|------|--------|
| `hasActiveFilters` | Derived — any filter state ≠ default |
| Apply | Closes panel (optional), resets `page` to 1, refetches or re-slices list |
| Clear | Resets filter state to defaults, refetches, sets `active` false |
| Tabs as filters | Queue status tabs move **inside** panel or remain as quick filters above list — prefer panel for consistency; tabs may stay if they map 1:1 to API `status` |

---

## Styling

- Reuse UI Kit `Button`, `FormField`, `glass-card`, theme tokens.
- Panel width `max-w-sm` (384px) on `sm+`; full width on mobile.
- Z-index above `AppShell` main content but below modals (`z-40` overlay, `z-50` panel).

---

## Showcase

Add **List filters** section on Components tab:

- `FeaturePage` with mock `ItemList` rows.
- `ListFilterTrigger` + `ListFilterPanel` with sample Select + Input.
- Toggle `active` when sample select ≠ `all`.

---

## Exports

Add to `ui-kit/package/src/index.ts`:

```typescript
export { ListFilterPanel, ListFilterTrigger } from './components/ListFilterPanel'
export type { ListFilterPanelProps, ListFilterTriggerProps } from './components/ListFilterPanel'
```

(Single module file or split — implementer choice; keep public API stable.)

---

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — reusable UI kit panel | 86ey58rda | This doc |
