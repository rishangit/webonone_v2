# 07 — Implementation Plan

Phased delivery for **1.9.4** on branch **`spec/1.9.4`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.9.4
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.9.4` |
| Scope | `packages/platform-nav/`, `webonone-v2/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.9.4/*` documentation
- [ ] Branch `spec/1.9.4`

---

## Phase 1 — Platform nav variants

**Goal:** `companyAdmin` and `member` nav defs ([03-nav-and-permissions.md](./03-nav-and-permissions.md)).

| Task | Detail |
|------|--------|
| `coreNav.ts` | Add `COMPANY_ADMIN_PLATFORM_NAV`, `MEMBER_PLATFORM_NAV`; extend `PlatformNavVariant` |
| `core_nav` | Add `company_admin` query value |
| Export | Rebuild `@webonone/platform-nav` |

**Exit criteria:** Type-check platform-nav package.

Spec: parent **86ey41tfh**

---

## Phase 2 — Backend assumable roles + sync

**Goal:** API for role picker and session-aware email sync ([02-session-role-selection.md](./02-session-role-selection.md), [04-email-role-handoff.md](./04-email-role-handoff.md)).

| Task | Detail |
|------|--------|
| `getAssumableRoles` | `company.service.ts` + controller + route |
| `syncEmailRoleForUser` | Accept optional `sessionRole` + `companyId`; validate against `users_roles` |
| Zod | Request body schema for sync endpoint |

**Exit criteria:** Manual API smoke; type-check backend.

---

## Phase 3 — Frontend session role + dialog

**Goal:** Dialog, Redux slice, PrivateRoute gate ([02-session-role-selection.md](./02-session-role-selection.md)).

| Task | Detail |
|------|--------|
| `sessionRoleSlice.ts` | State + thunks fetching assumable roles |
| `RoleSelectionDialog.tsx` | CustomDialog + role options |
| `PrivateRoute.tsx` | Wait for selection |
| `authSlice` logout | Clear session role |

**Exit criteria:** Dialog shows for multi-role test user after login.

---

## Phase 4 — AppLayout and route guards

**Goal:** Nav and permissions ([03-nav-and-permissions.md](./03-nav-and-permissions.md)).

| Task | Detail |
|------|--------|
| `AppLayout.tsx` | Nav from session role; sync body on Email click |
| `navItems.ts` | Map session role → variant |
| `/companies` | Super-admin guard |
| Redirect options | Pass correct `navVariant` / `core_nav` |

**Exit criteria:** Three role paths show correct sidebar; member hides Email.

---

## Phase 5 — Verification

| Task | Detail |
|------|--------|
| Type-check | `webonone-v2-root`, platform-nav |
| Manual | Login as super admin + company user; pick each role; verify nav + Email scope |
| Logout | Clears role; dialog reappears on next login |

**Exit criteria:** Acceptance checklist below passes.

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No.1.9.4 | 86ey41tfh | Phases 1–5 |

---

## Acceptance checklist

- [ ] After login with company membership, role dialog appears when user has 2+ assumable roles
- [ ] Super admin session shows Companies + Email; Email uses system scope
- [ ] Company admin session hides Companies; Email uses company scope
- [ ] Default user session hides Email nav group in WebOnOne
- [ ] Dialog once per session; logout clears selection
- [ ] No company membership → no dialog; default user nav
- [ ] `GET /company/me/assumable-roles` returns correct roles
- [ ] `POST /company/me/sync-email-role` respects session role
- [ ] `npm run type-check -w webonone-v2-root` passes

---

## Final verification commands

```bash
npm run build -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run dev:webonone
npm run dev:email
```
