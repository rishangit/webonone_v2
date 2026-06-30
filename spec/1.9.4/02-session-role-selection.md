# 02 — Session role selection

Post-login flow for choosing the active platform role for the current session.

## Assumable roles API

### `GET /api/v1/company/me/assumable-roles`

**Auth:** Bearer JWT (local verify).

**Response:**

```json
{
  "roles": [
    { "role": "super_admin", "companyId": null, "label": "Super Admin" },
    { "role": "company_admin", "companyId": "01HQ...", "label": "Company Admin", "companyName": "Acme Ltd" },
    { "role": "member", "companyId": "01HQ...", "label": "Default User", "companyName": "Acme Ltd" }
  ],
  "hasCompanyMembership": true
}
```

**Rules:**

| Source | Detail |
|--------|--------|
| `super_admin` | Include when `users_roles` has `role = super_admin` and `company_id IS NULL` |
| `company_admin` | Include when user has `company_admin` row for primary company |
| `member` | Include when user has any company role row (always offered as **Default User** when in a company) |
| No company rows | Return `{ roles: [{ role: "member", ... }], hasCompanyMembership: false }` — frontend skips dialog |

Labels are display strings for the dialog; backend may localize later.

## Session store (frontend)

Add `sessionRole` slice under `features/auth/` or `features/session/`:

| Field | Type | Notes |
|-------|------|-------|
| `activeRole` | `'super_admin' \| 'company_admin' \| 'member' \| null` | `null` until resolved after login |
| `activeCompanyId` | `string \| null` | Set for company-scoped roles |
| `selectionComplete` | `boolean` | Gate routes until role resolved |

**Lifecycle:**

1. Auth callback completes → fetch assumable roles.
2. If `hasCompanyMembership === false` → set `activeRole = member`, `selectionComplete = true`.
3. If one assumable role (excluding duplicate member when alone) → auto-set, skip dialog.
4. If two or more distinct choices → open dialog; on select → set role + `selectionComplete = true`.
5. Logout action → reset slice to initial state.

Persist in **Redux only** (not localStorage) per AC #5–6.

## Role selection dialog

| Property | Value |
|----------|-------|
| Component | `RoleSelectionDialog.tsx` in `webonone-v2/frontend/src/features/session/` |
| Shell | `@webonone/ui-kit` `CustomDialog` |
| Trigger | Rendered from `PrivateRoute` or root authenticated layout when `!selectionComplete && roles.length > 1` |
| Options | Radio list or selectable `ItemList` rows — one row per assumable role |
| Footer | Primary **Continue** disabled until selection; no Cancel (must pick or logout) |
| Copy | Title: "Choose your role"; subtitle explains session scope |

**Mapping ClickUp labels:**

| Option | Session `activeRole` | Nav variant |
|--------|---------------------|-------------|
| Super Admin | `super_admin` | `superAdmin` |
| Company Admin | `company_admin` | `companyAdmin` |
| Default User | `member` | `member` |

## Integration points

| Location | Change |
|----------|--------|
| `PrivateRoute.tsx` | Block `<Outlet />` until `selectionComplete`; show dialog overlay |
| `authSlice.ts` `logout` | Reset session role slice |
| `AppLayout.tsx` | Read `activeRole` instead of `useSuperAdminStatus` for nav variant |
| `useSuperAdminStatus.ts` | Deprecate for nav; keep for Companies page data if needed |

## Backend service

Add `getAssumableRoles(userId: string)` in `company.service.ts`:

1. Query `users_roles` via `userRole.repository.ts`.
2. Build deduplicated role list per rules above.
3. Resolve primary company via existing `getMyCompany` helper.

No new DB tables — session role is frontend-only; Email sync re-derives from request body or trusted session header.
