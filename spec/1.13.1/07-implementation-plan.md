# 07 — Implementation Plan

Phased delivery for **1.13.1** on branch **`spec/1.13.1`**.

---

## Branch workflow

```bash
git checkout master   # or merge base that includes 1.13.0
git pull
git checkout -b spec/1.13.1
```

| Rule | Detail |
|------|--------|
| Base | Branch that includes 1.13.0 company / session Login work |
| Spec branch | `spec/1.13.1` |
| Scope | `webonone-v2/backend`, `webonone-v2/frontend` (session feature) |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.1/*` documentation
- [ ] Branch `spec/1.13.1`
- [ ] ClickUp parent + subtask when tracking is required

---

## Phase 1 — Assumable roles API

**Goal:** [03-assumable-roles-for-selection.md](./03-assumable-roles-for-selection.md)

| Task | Detail |
|------|--------|
| `getAssumableRoles` | Always emit Default User when multi-account; add Super Admin; add owned companies only; drop per-company member rows from selection list |
| Flag | Add `requiresAccountSelection` (keep `hasCompanyMembership` if callers need it, or map both) |
| Rejected | Exclude from owned list |

**Exit criteria:** API fixtures match the three cases (Default-only / SA / companies).

---

## Phase 2 — Choose account dialog + gate

**Goal:** [02-account-selection-dialog.md](./02-account-selection-dialog.md)

| Task | Detail |
|------|--------|
| Slice | Open dialog iff `requiresAccountSelection`; else auto Default User |
| Dialog | Title/copy “Choose account”; cards; Default User pre-selected; Continue → reissue |
| Gate | Dashboard blocked until `selectionComplete` |
| Labels | Align Super Admin / Default User / company name |

**Exit criteria:** Manual acceptance below.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Acceptance checklist

- [ ] Default-User-only: no dialog; lands as Default User
- [ ] Owned company: dialog shows Default User (selected) + company card(s)
- [ ] Super Admin only: dialog shows Default User (selected) + Super Admin
- [ ] Super Admin + companies: all cards listed
- [ ] Rejected companies absent
- [ ] Continue reissues JWT; nav matches choice
- [ ] Dialog not dismissible without Continue
- [ ] All Companies mid-session Login still works
- [ ] Type-check green

---

## Open items

- ClickUp IDs when product tracking is required
- Optional: reuse same dialog for a future “Switch account” header action (out of scope)
