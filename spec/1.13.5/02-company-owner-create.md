# 02 — Company owner create (Add enabled)

Company owners must be able to **add** Data catalog items on every entity. Today most list pages gate Add with `canMutate = role === 'super_admin'`, and most POST routes require `requireSuperAdmin`. This doc defines the create path only; verify is [03](./03-super-admin-verify.md).

## Entities covered

| Entity | List page | Create entry | POST today | POST 1.13.5 |
|--------|-----------|--------------|------------|-------------|
| Tags | `TagsPage` | Add tag | `company_admin` \| `super_admin` | unchanged |
| Units | `UnitsPage` | Add unit | `super_admin` only | **`company_admin` \| `super_admin`** |
| Attributes | `AttributesPage` | Add attribute | `super_admin` only | **`company_admin` \| `super_admin`** |
| Products | `CatalogListPage` | Add product | `super_admin` only | **`company_admin` \| `super_admin`** |
| Services | `CatalogListPage` | Add service | `super_admin` only | **`company_admin` \| `super_admin`** |
| Spaces | `CatalogListPage` | Add space | `super_admin` only | **`company_admin` \| `super_admin`** |

Also align any **embed picker** create affordances (e.g. Tag picker `canCreate`) so company owners stay consistent with list pages.

## Frontend — enable Add

### Capability flag

Replace super-admin-only mutate gates used for **create** with:

```typescript
const canCreate =
  user?.role === 'super_admin' || user?.role === 'company_admin'
```

Use `canCreate` for:

- Showing the header **Add …** button on each list page
- Opening create dialogs / embed create flows

Keep a separate flag for edit/delete (still super admin):

```typescript
const canMutate = user?.role === 'super_admin'
```

Row menus: **Edit** / **Delete** remain super-admin only. Company owners do not get edit/delete in 1.13.5.

### Create form status UX

When `company_admin` creates:

| Field | Behaviour |
|-------|-----------|
| Status | Hidden, read-only, or fixed to **Unverified** — not a free select |
| Other fields | Same required fields as today (name, etc.) |

When `super_admin` creates: status select may include Unverified + Verified (existing behaviour; default may stay Unverified/`pending` or Verified per product preference — recommend default **Verified** for SA convenience, or **Unverified** for parity; **default `pending`** matches 1.11.0 and is safest).

## Backend — POST auth

### Middleware

Use existing `requireCompanyAdminOrSuperAdmin` on **all** create routes:

| Route file | Change |
|------------|--------|
| `tags.routes.ts` | Already `requireCompanyAdminOrSuperAdmin` on POST |
| `units.routes.ts` | POST: switch from `requireSuperAdmin` → `requireCompanyAdminOrSuperAdmin` |
| `attributes.routes.ts` | POST: same |
| `catalog.routes.ts` | POST for products/services/spaces: same |

PUT / PATCH / DELETE stay `requireSuperAdmin`.

### Forced status on create

In each create service (`tags`, `units`, `attributes`, `catalog`):

```text
if role === company_admin:
  status = 'pending'   // always — ignore body.status
else if role === super_admin:
  status = body.status ?? 'pending'
```

Rejecting with 403 when a company_admin sends `status: verified` is optional; **force overwrite** is required either way so spoofing cannot verify.

### Response

Created DTO includes `status: 'pending'` and `referenceCount: 0` (new entity has no usages yet).

## Duplicate names

Unchanged: unique name per entity type → 409 `DUPLICATE_NAME`. Company owners hit the same rule as super admins (global catalog).

## Acceptance

- [ ] Company owner sees **Add** on Tags, Units, Attributes, Products, Services, Spaces
- [ ] Member does **not** see Add
- [ ] Company owner create succeeds for all six; stored status is always `pending`
- [ ] Company owner POST with `status: "verified"` still results in `pending`
- [ ] Super admin create still works; may set verified when allowed by [03](./03-super-admin-verify.md)
- [ ] Company owner cannot open Edit/Delete on rows
