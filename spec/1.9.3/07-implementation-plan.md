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

## Phase 5 — Verification

| Task | Detail |
|------|--------|
| Type-check | ui-kit-root, webonone-v2-root |
| Manual | Showcase scroll/search/select; WebOnOne demo |

**Exit criteria:** Acceptance checklist below passes.

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No.1.9.3 Need to have the user selection dialog box | 86ey40acd | Phases 1–5 |

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
- [ ] `npm run type-check -w ui-kit-root`, `webonone-v2-root` pass

---

## Final verification commands

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w webonone-v2-root
npm run dev:ui-kit
npm run dev:webonone
```
