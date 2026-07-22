# 03 — List navigation to company profile

Opening the company profile must be the natural result of selecting a company on either list. Preserve existing 3-dot menus; do not replace Login or Approve/Reject with navigation-only rows.

## All Companies (`/settings/companies`)

**List:** `MyCompaniesList` on `AllCompaniesPage`.

### Row click → profile

| Behavior | Detail |
|----------|--------|
| Target | Navigate to `/settings/companies/:companyId` |
| Trigger | Click on the **row content** (name / logo / primary content area) — not only a menu item |
| Scope | Every membership row the user can see (Owner or Member) |
| Menu | Keep **Login** for Company Owner (1.13.0 / 1.13.1). Add **View details** (or **Open**) as an explicit menu item that navigates to the same profile route |

```text
ItemListItem
  ItemListContent  ──click──►  /settings/companies/:id
  ItemListMenu
    Login (owner, pending|approved)
    View details → same route
```

### Interaction rules

1. Clicking **Login** must **not** also navigate to the profile (stop propagation on menu actions).
2. Keyboard: row content should be activatable (button/link semantics or `role` + Enter) — prefer wrapping content in `Link` / `NavLink` or a clear button that navigates.
3. After Login succeeds, user may still open the profile later from the list; Login does not auto-open profile.

### Optional later (out of scope)

Deep-link from other surfaces; breadcrumbs beyond back control on the profile page.

## Super-admin Companies (`/companies`)

**List:** `CompaniesList` on `CompaniesPage`.

### Row click → profile

| Behavior | Detail |
|----------|--------|
| Target | Navigate to `/companies/:companyId` |
| Trigger | Click on row content (same as All Companies) |
| Scope | Every company in the admin list |
| Menu | Keep **Approve**, **Set pending**, **Reject**. Add **View details** → profile route |

```text
ItemListItem
  ItemListContent  ──click──►  /companies/:id
  ItemListMenu
    View details
    Approve / Set pending
    Reject (destructive)
```

### Interaction rules

1. Status menu actions must not navigate away before/during the PATCH.
2. After Approve/Reject, list stays on `/companies`; user can still open profile for full fields.
3. Super admin can open profile for **pending**, **approved**, and **rejected** companies.

## Router / prefetch

| Task | Detail |
|------|--------|
| Routes | Register both detail routes in `router.tsx` with lazy `CompanyProfilePage` |
| Prefetch | Extend `routePrefetch` for `/settings/companies/:companyId` and `/companies/:companyId` if the app prefetches sibling settings routes |
| Guards | Reuse existing auth shell; rely on API 403/404 for unauthorized detail access (no separate SA-only page component required) |

## Acceptance

1. All Companies: click company item → company profile loads for that id.
2. All Companies: 3-dot Login still works; View details opens profile.
3. Super-admin Companies: click company item → company profile loads.
4. Super-admin: Approve / Reject / Set pending still work from the list menu.
5. Menu clicks do not double-fire navigation + action.
