# 02 — UI Kit UserSelectionDialog (1.9.3)

Reusable single-select user picker for `@webonone/ui-kit`. Parent owns when the dialog opens; the component owns scroll, search debounce, role filter UI, and infinite loading via an injected **`loadUsers`** callback.

## Requirements (from ClickUp)

| Requirement | Detail |
|-------------|--------|
| Dialog shell | `CustomDialog` — scrollable body, title “Select user”, Cancel in footer |
| Infinite scroll | Load page 1 on open/filter change; append on scroll sentinel |
| Search | Text input; debounce ~300ms; filter by name and email (server-side via callback) |
| Role filter | Optional `roleOptions`; `Select` with “All roles” |
| Selection | Row click → `onSelect(user)` → close dialog |
| Reuse | No service imports in UI Kit — consumer supplies `loadUsers` |

## Types

```typescript
export interface UserOption {
  id: string
  displayName: string
  email: string
  role?: string
  avatarUrl?: string | null
}

export interface UserSelectionLoadParams {
  search: string
  role: string | null
  page: number
  pageSize: number
}

export interface UserSelectionLoadResult {
  users: UserOption[]
  hasMore: boolean
}

export type LoadUsersFn = (
  params: UserSelectionLoadParams,
) => Promise<UserSelectionLoadResult>
```

## Component API

```typescript
export interface UserSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (user: UserOption) => void
  loadUsers: LoadUsersFn
  title?: string
  description?: string
  pageSize?: number              // default 20
  roleOptions?: { value: string; label: string }[]
  defaultRole?: string | null
  emptyMessage?: string
  id?: string
}
```

Export `UserSelectionDialog`, `UserOption`, `UserSelectionLoadParams`, `UserSelectionLoadResult`, `LoadUsersFn` from `ui-kit/package/src/index.ts`.

## Behavior

### Open / close

- When `open` becomes `true`, reset internal state (search, role, page, accumulated users) and fetch page 1.
- Footer: `Button variant="outline"` Cancel → `onOpenChange(false)`.
- Row select → `onSelect(user)` then `onOpenChange(false)`.
- Do not require a Select/Confirm footer button — selection is immediate on row click.

### Search and role filter

- Search `Input` with placeholder “Search by name or email”.
- Debounce 300ms before calling `loadUsers`.
- Role `Select` when `roleOptions` provided; value `''` or `'all'` means no role filter (`role: null` in params).
- Any search or role change clears accumulated list, resets to page 1, refetches.

### Infinite scroll

- Render `ItemList` inside scrollable dialog body.
- Append `users` from each successful page.
- Place sentinel `div` at list bottom; `IntersectionObserver` with `root` = dialog body scroll container triggers load of `page + 1` when visible.
- Guard: do not fetch if `loading`, `!hasMore`, or dialog closed.
- Show `Spinner` on initial load and small inline spinner near sentinel while loading more.

### Row layout

Each user row (`ItemListItem`):

| Region | Content |
|--------|---------|
| Optional avatar | `Avatar` when `avatarUrl` set; initials fallback from `displayName` |
| Primary | `displayName` (truncate) |
| Secondary | `email` (muted, truncate) |
| Badge | `role` when present (`Badge` or muted text) |

Row is fully clickable (`button` or `role="button"` on row); use `itemListRowActiveClassName` briefly on mousedown if needed; no `ItemListMenu` (selection dialog, not action menu).

### Error handling

- Failed fetch: `Alert variant="destructive"` in body with message; Retry button refetches current page 1.
- Empty result: `ItemListEmpty` with `emptyMessage` or “No users found”.

### CustomDialog props

```tsx
<CustomDialog
  open={open}
  onOpenChange={onOpenChange}
  title={title ?? 'Select user'}
  description={description}
  sizeWidth="large"
  sizeHeight="large"
  disableContentScroll={false}
  footer={/* Cancel */}
>
```

Filter toolbar (`search + role`) fixed at top of body; list scrolls below (`flex flex-col min-h-0 flex-1`).

## Files

| Path | Change |
|------|--------|
| `ui-kit/package/src/components/UserSelectionDialog.tsx` | **New** |
| `ui-kit/package/src/index.ts` | Export component + types |
| `ui-kit/showcase/src/pages/DialogsPage.tsx` | Demo section (see [03-showcase-dialogs-demo.md](./03-showcase-dialogs-demo.md)) |

## Styling

- Toolbar: `flex flex-col gap-3 sm:flex-row sm:items-center` with `Input` flex-1 and role `Select` min-width.
- List container: `flex-1 min-h-0 overflow-y-auto` (min height ~280px in large dialog).
- Match `ItemList` / glass-card patterns from item-list skill.

## Accessibility

- Dialog title describes purpose (“Select user”).
- Search input: `aria-label="Search users"`.
- Role select: `aria-label="Filter by role"`.
- Rows: `aria-label={`Select ${user.displayName}`}`.

## Acceptance

- [ ] Exported from UI Kit with types
- [ ] Infinite scroll loads and appends pages
- [ ] Search debounce and role filter reset list
- [ ] Select closes dialog and returns `UserOption`
- [ ] Uses `CustomDialog` + `ItemList`
- [ ] Showcase demo on Dialogs tab

## ClickUp

Parent **86ey40acd** — all acceptance criteria in this doc.
