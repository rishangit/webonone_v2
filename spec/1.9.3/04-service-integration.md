# 04 — Service integration (1.9.3)

How microservice frontends adopt **`UserSelectionDialog`** without coupling UI Kit to any backend.

## Integration pattern

```text
Service FE                    UI Kit                         Service BE (optional)
──────────                    ──────                         ─────────────────────
Button opens dialog    →      UserSelectionDialog
loadUsers callback     ←      calls loadUsers(params)
onSelect(user)         ←      row click
API fetch users        →      (consumer implements)
```

| Rule | Detail |
|------|--------|
| Data ownership | Each service implements `loadUsers` against its own API or local DB copy |
| JWT | Pass `Authorization` in consumer’s `apiClient` inside `loadUsers` |
| No UI Kit imports of service code | Dialog stays in `ui-kit/package` only |

## `loadUsers` contract

Consumers implement:

```typescript
async function loadUsers(params: UserSelectionLoadParams): Promise<UserSelectionLoadResult> {
  const data = await apiClient<UserListResponse>(
    `/users?${new URLSearchParams({
      search: params.search,
      ...(params.role ? { role: params.role } : {}),
      page: String(params.page),
      pageSize: String(params.pageSize),
    })}`,
  )
  return {
    users: data.items.map(toUserOption),
    hasMore: data.page * data.pageSize < data.total,
  }
}
```

Backend shape (per-service, not shared in 1.9.3):

```typescript
{ items: UserOption[], total: number, page: number, pageSize: number }
```

## Reference consumer — WebOnOne v2

**Goal:** Prove reuse in a real service shell.

| Option | Detail |
|--------|--------|
| **A (preferred if API exists)** | `GET /api/v1/users` on WebOnOne backend — search + role + offset pagination for company-scoped users |
| **B (stub)** | `UserSelectionDemoSection` on Basic Settings with client-side mock `loadUsers` identical to showcase until API lands |

1.9.3 delivers **Option B minimum**; add Option A only if WebOnOne user list endpoint is in scope for the same branch (optional phase in [07-implementation-plan.md](./07-implementation-plan.md)).

### Suggested UI placement

- `webonone-v2/frontend/src/features/settings/basic/components/UserSelectionDemo.tsx` — “Pick user” button for QA.
- Or integrate into future company member assignment when that screen exists.

## Email service (optional)

Email admin may anchor flows may pick users later. No Email changes required for 1.9.3 acceptance if WebOnOne reference exists.

## Agent guidance

| File | Action |
|------|--------|
| `.cursor/skills/item-list/SKILL.md` | Add bullet: selectable rows without menu → `UserSelectionDialog` |
| `.cursor/rules/ui-kit-consumption.mdc` | Optional one-liner cross-link |

## Layout in feature code

```tsx
const [open, setOpen] = useState(false)
const [selected, setSelected] = useState<UserOption | null>(null)

<Button onClick={() => setOpen(true)}>Choose user</Button>
<UserSelectionDialog
  open={open}
  onOpenChange={setOpen}
  onSelect={setSelected}
  loadUsers={loadCompanyUsers}
  roleOptions={[
    { value: 'member', label: 'Member' },
    { value: 'company_admin', label: 'Company admin' },
  ]}
/>
```

## Acceptance

- [ ] WebOnOne feature imports dialog from `@webonone/ui-kit`
- [ ] `loadUsers` implemented (mock or API)
- [ ] `onSelect` receives full `UserOption`
- [ ] `npm run type-check -w webonone-v2-root` passes

## ClickUp

Parent **86ey40acd** — criterion 5 (reusable across services).
