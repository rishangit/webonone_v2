# 02 — Settings → All Companies nav

## Requirement

Add a Settings submenu item **All Companies** so every signed-in WebOnOne user can open their company collection without using the super-admin top-level **Companies** item.

## platform-nav

Update Settings children in:

- `MEMBER_PLATFORM_NAV`
- `MAIN_PLATFORM_NAV` (company admin)
- `SUPER_ADMIN_PLATFORM_NAV`

| Label | Path | Order |
|-------|------|-------|
| **All Companies** | `/settings/companies` | First Settings child (before Basic Settings) |
| Basic Settings | `/settings/basic` | Unchanged |
| System Theme | `/settings/system-theme` | Unchanged |

```ts
{
  kind: 'group',
  label: 'Settings',
  children: [
    { kind: 'item', path: '/settings/companies', label: 'All Companies' },
    { kind: 'item', path: '/settings/basic', label: 'Basic Settings' },
    { kind: 'item', path: '/settings/system-theme', label: 'System Theme' },
  ],
}
```

### Do not change

| Item | Path | Audience |
|------|------|----------|
| **Companies** (approval) | `/companies` | Super admin only — stays a top-level item |

## WebOnOne wiring

| File | Change |
|------|--------|
| `webonone-v2/frontend/src/features/shell/config/navItems.ts` | Icon for `/settings/companies` (e.g. `Building2` or `Briefcase`) |
| `webonone-v2/frontend/src/app/router.tsx` | Lazy route `settings/companies` → All Companies page |
| `webonone-v2/frontend/src/app/routePrefetch.ts` | Prefetch map entry |

## Access

| Session role | Sees All Companies | Sees top-level Companies |
|--------------|--------------------|---------------------------|
| `member` | Yes | No |
| `company_admin` | Yes | No |
| `super_admin` | Yes | Yes |

No new env keys. Local route only — not an iframe peer sentinel.

## Acceptance

1. Expanding Settings shows **All Companies** for member and company admin.
2. Click navigates in-shell to `/settings/companies` (sidebar stays mounted).
3. Super admin still has both **Companies** (top) and **All Companies** (Settings).
4. `packages/platform-nav` unit tests cover the new Settings child on all three variants.
