# 07 — Implementation Plan

Phased delivery for **1.13.5** on branch **`spec/1.13.5`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b spec/1.13.5
```

| Rule | Detail |
|------|--------|
| Base | Branch that includes Data catalog (1.11.0+) and company_admin Data nav (1.12.3) |
| Spec branch | `spec/1.13.5` |
| Scope | `data/frontend` + `data/backend` |
| WebOnOne / Identity / UI Kit | None required |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.5/*` documentation
- [ ] Branch `spec/1.13.5`
- [ ] ClickUp parent + subtasks when tracking is required

---

## Phase 1 — Backend create auth + forced Unverified

**Goal:** [02-company-owner-create.md](./02-company-owner-create.md)

| Task | Detail |
|------|--------|
| Routes | POST units / attributes / products / services / spaces → `requireCompanyAdminOrSuperAdmin` |
| Services | On create, if `company_admin` → force `status = 'pending'` |
| Tests / manual | Owner POST verified spoof still stores pending |

**Exit criteria:** Company owner can POST all six; always `pending`.

**Verify:** `npm run type-check -w data-root` (backend workspace as configured)

---

## Phase 2 — Frontend Add + create status UX

**Goal:** [02](./02-company-owner-create.md)

| Task | Detail |
|------|--------|
| List pages | `canCreate` for SA + company_admin; keep `canMutate` SA-only for edit/delete |
| Forms | Owner create: status locked/hidden as Unverified |
| Pickers | Tag (and any other) create buttons use same `canCreate` |

**Exit criteria:** Owner sees Add on all six lists; member does not.

---

## Phase 3 — Super admin verify + Unverified labels

**Goal:** [03-super-admin-verify.md](./03-super-admin-verify.md)

| Task | Detail |
|------|--------|
| StatusBadge / filters / dashboard | Label `pending` as **Unverified** |
| List menu | **Verify** for SA on Unverified rows → PATCH status |
| API | Ensure only SA can persist `verified` on write paths |

**Exit criteria:** Filter Unverified → Verify → badge Verified.

---

## Phase 4 — Reference counts

**Goal:** [04-reference-counts.md](./04-reference-counts.md)

| Task | Detail |
|------|--------|
| Services | Compute `referenceCount` on list + get |
| Types FE | Extend DTOs |
| List UI | Show References: N on each row |

**Exit criteria:** Linking a tag to a product increments tag `referenceCount` on next list load.

**Verify:** `npm run type-check -w data-root`

---

## Acceptance checklist

- [ ] Company owner: Add enabled on Tags, Units, Attributes, Products, Services, Spaces
- [ ] Owner create → Unverified (`pending`); cannot self-verify
- [ ] Super admin: Verify works; edit/delete unchanged
- [ ] `referenceCount` on API + list UI
- [ ] Status UI says Unverified (not Pending)
- [ ] Embed path (WebOnOne Data nav as company_admin) behaves the same
- [ ] `npm run type-check -w data-root` passes

## Out of scope reminders

- No `company_id` partitioning of catalog rows
- No owner edit/delete
- No cross-service reference counts
- No DB rename `pending` → `unverified`
