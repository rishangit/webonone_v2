# 03 — Navigation and permissions

Session role drives WebOnOne shell navigation via `@webonone/platform-nav` variants.

## Nav variants

Extend `PlatformNavVariant` in `packages/platform-nav/src/coreNav.ts`:

| Variant | Nav items | When |
|---------|-----------|------|
| `superAdmin` | Home, Companies, Email (history + templates), Settings | Session role `super_admin` |
| `companyAdmin` | Home, Email (history + templates), Settings | Session role `company_admin` |
| `member` | Home, Settings only | Session role `member` (default user) |
| `main` | **Deprecated for WebOnOne** — alias to `member` or remove after migration | — |

### `COMPANY_ADMIN_PLATFORM_NAV`

Same as current `MAIN_PLATFORM_NAV` (Home + Email group + Settings) — Email visible with company scope after sync.

### `MEMBER_PLATFORM_NAV`

```typescript
[
  { kind: 'item', path: '/', label: 'Home' },
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/basic', label: 'Basic Settings' },
      { kind: 'item', path: '/settings/system-theme', label: 'System Theme' },
    ],
  },
]
```

No Email group — satisfies AC #4 (hide Email menu for default user).

## WebOnOne `navItems.ts`

Map session role → variant:

```typescript
function sessionRoleToNavVariant(role: SessionRole): PlatformNavVariant {
  switch (role) {
    case 'super_admin': return 'superAdmin'
    case 'company_admin': return 'companyAdmin'
    default: return 'member'
  }
}
```

Update `AppLayout` to use `buildPlatformNav(sessionRoleToNavVariant(activeRole))`.

## Route guards

| Route | Allowed session roles |
|-------|----------------------|
| `/companies` | `super_admin` only |
| `/settings/*` | all authenticated |
| `/` | all authenticated |

Add `SuperAdminRoute` wrapper or inline check redirecting non–super-admin to `/`.

## `core_nav` query param

Extend `toCoreNavQueryValue` / `parsePlatformNavVariant`:

| Session role | `core_nav` value |
|--------------|------------------|
| `super_admin` | `super_admin` (existing) |
| `company_admin` | `company_admin` (new) |
| `member` | `main` (existing default) |

Satellite FEs (Email, Identity) use parsed variant for sidebar when `return_url` present.

## Companies page

Continue using `requireSuperAdmin` middleware on API. Frontend guard prevents navigation for non–super-admin sessions even if URL typed manually.
