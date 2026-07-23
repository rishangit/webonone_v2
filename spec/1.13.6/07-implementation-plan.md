# 07 — Implementation Plan

Phased delivery for **1.13.6** on branch **`spec/1.13.6`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b spec/1.13.6
```

| Rule | Detail |
|------|--------|
| Base | Branch with Identity Users (SA), `users_roles` in Identity (1.11.1), UserSelectionDialog (1.9.3), Email/SMS internal send |
| Spec branch | `spec/1.13.6` |
| Scope | Identity FE/BE; WebOnOne BE register hook; Email BE; SMS BE |
| UI Kit | Reuse only — no package API change required |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.6/*` documentation
- [x] Branch `spec/1.13.6`
- [x] ClickUp parent **86eyd50u3** + ready subtasks

---

## Phase 1 — Membership + customers list API (Identity)

**Goal:** [02](./02-company-customers-list.md), [03](./03-add-customer-user-selection.md) (API only)

| Task | Detail |
|------|--------|
| List | `GET /api/v1/companies/:companyId/customers` |
| Add | `POST /api/v1/companies/:companyId/customers` `{ userId }` |
| Guards | JWT `company_admin` + matching `companyId` |
| Exclude | Users list support `excludeCompanyId` for picker |
| Idempotency | Existing member → no duplicate row |

**Exit criteria:** curl/Postman as company owner lists/adds members.

**Verify:** `npm run type-check -w identity-root`

---

## Phase 2 — Identity Users UI (list + Add dialog)

**Goal:** [02](./02-company-customers-list.md), [03](./03-add-customer-user-selection.md)

| Task | Detail |
|------|--------|
| UsersPage | Company-admin mode; Add; `UserSelectionDialog` |
| Nav | Allow company_admin access to `/users` |
| Store/API | Wire list + add + loadUsers exclude |

**Exit criteria:** Owner adds user from dialog; row appears.

---

## Phase 3 — Welcome notifications

**Goal:** [04](./04-welcome-notifications.md)

| Task | Detail |
|------|--------|
| SMS | `GET .../gateway-status` internal |
| Identity | Env for Email/SMS; after add enqueue email; conditional SMS |
| Soft fail | Membership kept on notify errors |

**Exit criteria:** Email always; SMS only with gateway + phone.

**Verify:** `npm run type-check` Identity + SMS

---

## Phase 4 — Seed welcome templates on registration

**Goal:** [05](./05-default-welcome-templates.md)

| Task | Detail |
|------|--------|
| Email internal | `ensure-welcome` for company |
| SMS internal | `ensure-welcome` for company; platform `welcome` seed if missing |
| WebOnOne | Call both after `registerCompany` |

**Exit criteria:** New company has Email + SMS company `welcome`.

**Verify:** `npm run type-check` Email + SMS + WebOnOne

---

## Acceptance checklist

- [ ] Company owner: Identity → Users shows company customers only
- [ ] Add → UserSelectionDialog → select → list updates
- [ ] Identity `users_roles` has `member` + `company_id`
- [ ] Welcome email queued on add
- [ ] Welcome SMS only when gateway configured and phone present
- [ ] Register company → Email + SMS company `welcome` templates exist
- [ ] Super admin Users directory unchanged
- [ ] Type-check passes for touched workspaces

---

## ClickUp subtask traceability

| ClickUp | ID | Phase / doc |
|---------|-----|-------------|
| Parent | 86eyd50u3 | All |
| Company customers list | 86eyd50vy | Phase 1–2 / [02](./02-company-customers-list.md) |
| Add via UserSelectionDialog | 86eyd50w9 | Phase 1–2 / [03](./03-add-customer-user-selection.md) |
| Welcome email and SMS | 86eyd50we | Phase 3 / [04](./04-welcome-notifications.md) |
| Seed welcome templates | 86eyd50wt | Phase 4 / [05](./05-default-welcome-templates.md) |
