# 03 — Showcase Dialogs demo (1.9.3)

Demonstrate **`UserSelectionDialog`** on the UI Kit showcase **Dialogs** tab with mock data — no backend required.

## Requirements

| Requirement | Detail |
|-------------|--------|
| Location | `ui-kit/showcase/src/pages/DialogsPage.tsx` (or dedicated section if file split) |
| Trigger | `Button` “Open user selection” opens dialog |
| Mock loader | In-file `mockLoadUsers` filters 120 fake users by search/role; slices by page |
| Roles | `member`, `company_admin`, `super_admin` in `roleOptions` |
| Result display | After select, show chosen `displayName` + `email` below trigger |

## Mock `loadUsers` behavior

```typescript
const MOCK_USERS: UserOption[] = /* generate 120 entries with varied roles */

async function mockLoadUsers(params: UserSelectionLoadParams): Promise<UserSelectionLoadResult> {
  await delay(400) // simulate network
  let filtered = MOCK_USERS
  if (params.search.trim()) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }
  if (params.role) {
    filtered = filtered.filter((u) => u.role === params.role)
  }
  const start = (params.page - 1) * params.pageSize
  const slice = filtered.slice(start, start + params.pageSize)
  return {
    users: slice,
    hasMore: start + params.pageSize < filtered.length,
  }
}
```

## Demo layout

```text
Dialogs tab
  … existing CustomDialog examples …
  ## User selection
  Button → UserSelectionDialog
  Selected: (none) | Jane Doe · jane@example.com
```

## Files

| Path | Change |
|------|--------|
| `ui-kit/showcase/src/pages/DialogsPage.tsx` | Add demo section + state for open/selected |

If Dialogs content lives only on `ComponentsPage.tsx`, add section there instead — match existing showcase routing (`Showcase` nav for Dialogs).

## Acceptance

- [ ] Demo opens dialog, scroll loads more mock users
- [ ] Search and role filter work against mock data
- [ ] Selected user shown after pick
- [ ] `npm run type-check -w ui-kit-root` passes

## ClickUp

Parent **86ey40acd** — showcase portion of acceptance criteria.
