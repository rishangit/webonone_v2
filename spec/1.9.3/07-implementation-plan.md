# 07 — Implementation Plan

Phased delivery for **1.9.3** on branch **`spec/1.9.3`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.9.3
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.9.3` |
| Scope | `ui-kit/`, `webonone-v2/frontend/`, `.cursor/skills/item-list/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.9.3/*` documentation
- [ ] Branch `spec/1.9.3`

---

## Phase 1 — UI Kit UserSelectionDialog

**Goal:** Shared dialog with infinite scroll, search, role filter ([02-ui-kit-user-selection-dialog.md](./02-ui-kit-user-selection-dialog.md)).

| Task | Detail |
|------|--------|
| `UserSelectionDialog.tsx` | CustomDialog + ItemList + IntersectionObserver sentinel |
| Types | `UserOption`, `LoadUsersFn`, etc. |
| Export | `ui-kit/package/src/index.ts` |

**Exit criteria:** Type-check ui-kit-root.

Spec: parent **86ey40acd**

---

## Phase 2 — Showcase Dialogs demo

**Goal:** Mock-data demo ([03-showcase-dialogs-demo.md](./03-showcase-dialogs-demo.md)).

| Task | Detail |
|------|--------|
| `DialogsPage.tsx` | Trigger, dialog, selected user display |
| `mockLoadUsers` | 120 users, filter + paginate |

**Exit criteria:** Manual smoke in `npm run dev:ui-kit`.

---

## Phase 3 — WebOnOne reference consumer

**Goal:** Service integration ([04-service-integration.md](./04-service-integration.md)).

| Task | Detail |
|------|--------|
| `UserSelectionDemo.tsx` | Basic Settings or standalone demo section |
| `loadUsers` | Mock or `GET /users` if backend added |

**Exit criteria:** Type-check webonone-v2-root.

---

## Phase 4 — Agent guidance

| Task | Detail |
|------|--------|
| `item-list/SKILL.md` | Cross-link selectable user dialog |

---

## Phase 5 — Verification (dialog)

| Task | Detail |
|------|--------|
| Type-check | ui-kit-root, webonone-v2-root |
| Manual | Showcase scroll/search/select; WebOnOne demo |

**Exit criteria:** Dialog acceptance checklist below passes.

---

## Phase 6 — WebOnOne `users_roles` migration

**Goal:** Consolidate permissions ([05-webonone-users-roles.md](./05-webonone-users-roles.md)).

| Task | Detail |
|------|--------|
| Migration | Create `users_roles`; migrate data; rename `approved_by_*`; drop legacy tables |
| Repository | `userRole.repository.ts`; trim `company.repository.ts` |
| Service / middleware | `company.service.ts`, `requireSuperAdmin.ts`, seed |
| Env | `SUPER_ADMIN_USER_ID` in `.env.example` |

**Exit criteria:** Migrations run; company + super-admin API smoke; type-check backend.

Spec: subtask **86ey40ya9**

---

## Phase 7 — Final verification

| Task | Detail |
|------|--------|
| Migrate | `npm run migrate -w @webonone/webonone-backend` |
| Type-check | ui-kit-root, webonone-v2-root |
| Seed | `npm run seed -w @webonone/webonone-backend` with `SUPER_ADMIN_USER_ID` |

**Exit criteria:** Full acceptance checklist passes.

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No.1.9.3 Need to have the user selection dialog box | 86ey40acd | Phases 1–5 |
| need to have the user role table | 86ey40ya9 | Phase 6–7 |

---

## Acceptance checklist

- [ ] `UserSelectionDialog` uses `CustomDialog` (scrollable modal)
- [ ] Infinite scroll loads users on scroll via `loadUsers`
- [ ] Search bar filters by name/email (debounced)
- [ ] Role filter when `roleOptions` provided
- [ ] Select row closes dialog and returns user via `onSelect`
- [ ] Exported from `@webonone/ui-kit`
- [ ] Showcase Dialogs tab demo with mock data
- [ ] WebOnOne reference consumer wired
- [ ] `users_roles` table exists; `super_admins` and `company_memberships` removed
- [ ] Super-admin middleware checks `users_roles`
- [ ] Company register/approve uses `users_roles`
- [ ] `npm run type-check -w ui-kit-root`, `webonone-v2-root` pass

---

## Final verification commands

```bash
npm run build -w @webonone/ui-kit
npm run migrate -w @webonone/webonone-backend
npm run type-check -w ui-kit-root
npm run type-check -w webonone-v2-root
npm run dev:ui-kit
npm run dev:webonone
```
