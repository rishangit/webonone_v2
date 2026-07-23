# 03 — Add customer via UserSelectionDialog

ClickUp: [86eyd50w9](https://app.clickup.com/t/86eyd50w9)

## Problem

Company owners need a consistent way to pick an existing platform user and attach them to the company — without inventing a new modal.

## Flow

```text
Users page (company_admin) → Add
  → UserSelectionDialog open
  → loadUsers (Identity directory; exclude existing company members)
  → onSelect(user)
  → POST add customer
  → dialog closes; list refreshes; welcome notifications (see 04)
```

## UI

| Element | Detail |
|---------|--------|
| Trigger | Header **Add** (`Button`) on company-mode Users page |
| Dialog | `@webonone/ui-kit` **`UserSelectionDialog`** ([1.9.3](../1.9.3/02-ui-kit-user-selection-dialog.md)) |
| Search | Name / email (existing dialog behavior) |
| Role filter | Optional; default hide or set to all — picker is for any registered user |
| Footer | Cancel only; selection is row click |
| Already members | Do not appear in results (server-side exclude preferred) |

## API — add customer

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/companies/:companyId/customers` | User JWT; `company_admin` for `:companyId` |

Body:

```json
{ "userId": "user_…" }
```

### Server rules

1. Validate company owner: JWT `platform_role === company_admin` and JWT `company_id === :companyId`.
2. Validate target user exists in Identity `users`.
3. If target already has `member` for this company → **200** idempotent (or **409** with clear message — pick **200** + no duplicate row).
4. If target is already `company_admin` for this company → **409** “User is already an owner of this company.”
5. Insert `users_roles`: `{ role: 'member', company_id, user_id }` with new nanoid id.
6. Trigger welcome notifications ([04](./04-welcome-notifications.md)) — do not fail the HTTP success if notify fails.

### Response

`201` with the customer list item DTO (same shape as list row).

## loadUsers contract

Injectable `loadUsers` for the dialog:

```ts
async ({ search, page, pageSize }) => {
  // GET Identity users directory (existing picker/list API)
  // Pass excludeCompanyId = session companyId so members are omitted
}
```

If exclude query is not on the existing users list API, add `excludeCompanyId` (or `excludeRoleCompanyId`) filter that omits users who already have any `users_roles` row for that company (`member` or `company_admin`).

## Frontend files (expected)

| Path | Change |
|------|--------|
| `UsersPage.tsx` | Add state `addOpen`; render `UserSelectionDialog`; wire `onSelect` → add API → reload list |
| `usersApi.ts` | `addCompanyCustomer`, `listCompanyCustomers`, exclude-aware `loadUsers` |

## Acceptance

1. Add opens dialog; selecting a user closes it and adds the row.
2. User already in company does not appear (or add is idempotent).
3. Non-owner cannot call POST successfully (403).
4. No new UI Kit component — reuse `UserSelectionDialog`.
