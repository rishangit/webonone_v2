# 03 — Assumable roles for account selection

The Choose account dialog is fed by **`GET /api/v1/company/me/assumable-roles`** (WebOnOne). Identity **`POST /auth/session-role`** applies the choice.

## Response contract

```ts
type AssumableRoleOption = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
  label: string
  companyName?: string
}

type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  /** True when the user owns ≥1 pending/approved company OR is Super Admin — i.e. dialog should be considered */
  requiresAccountSelection: boolean
}
```

`hasCompanyMembership` from 1.13.0 may remain for compatibility, but **1.13.1 gate logic must use `requiresAccountSelection`** (or equivalent derived flag):

```text
requiresAccountSelection =
  user is Super Admin
  OR user owns ≥1 company (company_admin + status pending|approved)
```

## Required `roles` contents

### When `requiresAccountSelection === false`

```ts
{
  roles: [{ role: 'member', companyId: null, label: 'Default User' }],
  requiresAccountSelection: false
}
```

Client auto-applies the single Default User option; **no dialog**.

### When `requiresAccountSelection === true`

Build `roles` in this order:

1. **Always** append Default User:
   `{ role: 'member', companyId: null, label: 'Default User' }`
2. If Super Admin:  
   `{ role: 'super_admin', companyId: null, label: 'Super Admin' }`
3. For each owned company (newest first or stable name sort — pick one and document in code):  
   `{ role: 'company_admin', companyId, label: companyName, companyName }`  
   Prefer label = **company name**; UI can show “Company Owner” as description.

**Forbidden in this multi-account list:**

- `{ role: 'member', companyId: <companyId> }` per-company member rows
- Rejected companies
- Duplicate Default User rows

## Client gate rules

| API result | Client action |
|------------|---------------|
| `requiresAccountSelection === false` | Auto-select only role; `selectionComplete = true`; no dialog |
| `requiresAccountSelection === true` | Open dialog; pre-select Default User card; wait for Continue |

Do **not** auto-apply Super Admin or a company when multiple accounts exist — even if `roles.length === 1` would previously have auto-selected (e.g. Super Admin alone must still show dialog with Default User + Super Admin, so length ≥ 2 whenever `requiresAccountSelection`).

## Session reissue

Unchanged from 1.13.0:

| Field | Values |
|-------|--------|
| `platformRole` | `member` \| `super_admin` \| `company_admin` |
| `companyId` | `null` for Default User / Super Admin; company id for Company Owner |

Identity continues to assert the user may assume the role (`assertCanAssumeSessionRole`).

## Gaps vs current 1.13.0 implementation

| Current behavior | 1.13.1 requirement |
|------------------|--------------------|
| Dialog when `hasCompanyMembership && roles.length > 1` | Dialog when Super Admin **or** owned companies |
| Super Admin only → auto Super Admin | Dialog: Default User + Super Admin |
| Companies present → Default User often **missing** from list | Default User **always** first when dialog shown |
| Company-scoped `member` options in list | Remove from selection list |
| Auto-pick when `roles.length === 1` | Only auto-pick when **not** `requiresAccountSelection` |

## Acceptance

1. Default-User-only → `{ requiresAccountSelection: false, roles: [Default User] }`.
2. One owned company → `requiresAccountSelection: true`, roles = [Default User, Company Owner card].
3. Super Admin only → `requiresAccountSelection: true`, roles = [Default User, Super Admin].
4. No rejected companies in `roles`.
5. No per-company member options in `roles` when building the Choose account list.
