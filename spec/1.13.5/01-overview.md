# 01 — Overview (1.13.5)

## Vision

Company owners contribute to the shared Data catalog without waiting on super admins to type every row. Their submissions land as **Unverified** until a super admin reviews and **verifies** them. Everyone managing the catalog can see **how many times** each entity is referenced, so delete and verify decisions stay grounded in real usage.

## User stories

1. As a **company owner** (`company_admin`), on every Data entity list (Tags, Units, Attributes, Products, Services, Spaces) I see an enabled **Add** button and can create a new item.
2. As a company owner, every item I create is stored with status **Unverified** (`pending`); I cannot mark it Verified myself.
3. As a **super admin**, I can review Unverified items and **Verify** them so downstream features treat them as approved reference data.
4. As a company owner or super admin, on each list/detail row I see a **reference count** — how many times that entity is used in the Data catalog.

## Goals (1.13.5)

1. **Enable Add for company owners** — Same create entry point as super admin on all six entity list pages (and peer embed dialogs that already gate create).
2. **Backend create for company owners** — POST on all six resources accepts `company_admin` or `super_admin`.
3. **Forced Unverified on owner create** — Server ignores any client `status: verified` from `company_admin`; always persist `pending`.
4. **Super-admin-only verification** — Only `super_admin` may set `status` to `verified` (create or update).
5. **Reference counts** — API returns `referenceCount` on list items and detail; UI shows it on every entity row.
6. **UI label clarity** — Display `pending` as **Unverified** (filter option + badge); keep API/DB enum value `pending` for compatibility with [1.11.0](../1.11.0/03-domain-entities.md).

## Scope (1.13.5)

### In scope

- Data FE: `canCreate` / Add button for `company_admin` + `super_admin` on Tags, Units, Attributes, Products, Services, Spaces list pages
- Data FE: create dialogs/forms for owners hide or lock status to Unverified
- Data BE: widen POST auth to `requireCompanyAdminOrSuperAdmin` on units, attributes, catalog (products/services/spaces); tags already allowed
- Data BE: create/update status rules by role
- Data BE + FE: `referenceCount` field and list row display
- Status badge / filter label **Unverified** for `pending`
- Optional list menu **Verify** for super admin on Unverified rows

### Out of scope

- Company-scoped catalog partitions (`company_id` on rows) — catalog remains global
- Letting company owners edit or delete existing rows (still **super_admin** only unless a later spec expands)
- Bulk verify / approve queue page (filter by Unverified is enough for v1)
- Reference counts from **other microservices** (Email, SMS, WebOnOne) — only in-Data FK / junction usage
- Renaming DB/API enum from `pending` → `unverified` (breaking); UI wording only in this release
- Identity role model changes

## Glossary

| Term | Definition |
|------|------------|
| **Company owner** | Session role `company_admin` (Company Owner after Login to an approved company) |
| **Unverified** | UI label for API/DB status `pending` — awaiting super-admin verification |
| **Verified** | API/DB status `verified` — approved for use as platform reference data |
| **Reference count** | Integer of inbound usages of this entity inside the Data database (see [04](./04-reference-counts.md)) |
| **Verify** | Super-admin action that sets `status` from `pending` → `verified` |

## Permission matrix (delta)

| Action | `member` | `company_admin` | `super_admin` |
|--------|----------|-----------------|---------------|
| List / read | yes (existing) | yes | yes |
| **Create (Add)** | no | **yes → always Unverified** | yes (may set Verified) |
| Update fields / Delete | no | no | yes |
| Set `status: verified` | no | no | yes |

## Success criteria

1. As company owner, **Add** is visible and works on all six entity lists (standalone Data and WebOnOne Data embed).
2. Owner-created rows always show **Unverified**; API stores `pending`.
3. Owner cannot obtain `verified` via POST/PATCH body spoofing (403 or forced overwrite).
4. Super admin can Verify; row becomes **Verified**.
5. Each list row shows `referenceCount` matching [04](./04-reference-counts.md) rules.
6. `npm run type-check -w data-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.5 | TBD | All docs |
| Subtask — Owner Add + create rules | TBD | [02](./02-company-owner-create.md) |
| Subtask — Super admin verify | TBD | [03](./03-super-admin-verify.md) |
| Subtask — Reference counts | TBD | [04](./04-reference-counts.md) |
