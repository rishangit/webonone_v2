# 03 — Super admin verify

Owner-created (and any other) **Unverified** catalog rows must be reviewable and promotable to **Verified** by a **super admin** only.

## Status model (unchanged storage)

| API / DB value | UI label (1.13.5) |
|----------------|-------------------|
| `pending` | **Unverified** |
| `verified` | **Verified** |

Do **not** migrate the ENUM in 1.13.5. Update badges, filter labels, and copy only.

## Who may change status

| From → To | `company_admin` | `super_admin` |
|-----------|-----------------|---------------|
| → `pending` (Unverified) | only via create (forced) | yes on create/update |
| → `verified` | **forbidden** | **allowed** |
| `verified` → `pending` | forbidden | allowed (un-verify / return to review) |

### API enforcement

On **POST**, **PUT**, and **PATCH**:

- If actor is `company_admin`: never persist `verified` (create path already covered in [02](./02-company-owner-create.md); updates remain SA-only so company_admin never hits PATCH).
- If actor is `super_admin`: accept `status` in body per Zod schema.

Optional dedicated endpoint (nice-to-have, not required if PATCH suffices):

```http
POST /api/v1/{entity}/:id/verify
Authorization: Bearer <JWT>   # requireSuperAdmin
```

Sets `status = 'verified'`. Prefer reusing **PATCH** `{ "status": "verified" }` for v1 to avoid new routes.

## UI — super admin

### List filter

Status filter options:

| Value | Label |
|-------|-------|
| `all` | All |
| `verified` | Verified |
| `pending` | **Unverified** |

Dashboard cards that say “Pending” should say **Unverified** for consistency.

### Status badge

`StatusBadge`: when `status === 'pending'`, label **Unverified** (not “Pending”).

### Verify action

On Unverified rows, for `super_admin` only, 3-dot menu includes:

| Action | Behaviour |
|--------|-----------|
| **Verify** | PATCH `{ status: 'verified' }`; toast success; refresh list |
| Edit | Existing editor |
| Delete | Existing confirm + DELETE (blocked when `referenceCount > 0` — see [04](./04-reference-counts.md)) |

Company owners do not see **Verify**.

### Editor

Super admin editor keeps status select: Unverified | Verified. Saving with Verified is the same as Verify.

## Queue workflow (v1)

No separate “approval queue” page. Super admin:

1. Opens entity list
2. Filters **Unverified**
3. Reviews row (and reference count)
4. **Verify** or Edit then save

## Acceptance

- [ ] Badge and filters show **Unverified** for `pending`
- [ ] Only super admin can set `verified` via API
- [ ] List **Verify** (or editor status) flips Unverified → Verified
- [ ] Company owner never sees Verify and never ends with Verified after create
- [ ] Dashboard pending counts use Unverified wording
