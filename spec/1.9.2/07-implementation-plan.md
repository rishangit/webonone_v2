# 07 — Implementation Plan

Phased delivery for **1.9.2** on branch **`spec/1.9.2`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.9.2
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.9.2` |
| Scope | `ui-kit/`, `email/frontend/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.9.2/*` documentation
- [ ] Branch `spec/1.9.2`

---

## Phase 1 — UI Kit Pagination component

**Goal:** Shared pagination control with full API from [02-ui-kit-pagination.md](./02-ui-kit-pagination.md).

| Task | Detail |
|------|--------|
| `Pagination.tsx` | Navigation, summary, page-size select, ellipsis window |
| Export | `ui-kit/package/src/index.ts` |
| Showcase | `ControlsPage.tsx` — interactive demo |

**Exit criteria:** Type-check ui-kit; showcase renders all controls.

Spec: subtask **86ey3yjxz**

---

## Phase 2 — Email History consumer

**Goal:** Replace ad-hoc pagination on History with `Pagination`.

| Task | Detail |
|------|--------|
| `HistoryPage.tsx` | Wire `Pagination`; optional `pageSize` state + `onPageSizeChange` |
| Preserve filters | `loadHistory` receives page; filter state unchanged on page change |

**Exit criteria:** History list paginates with new component; type-check email-root.

---

## Phase 3 — Verification

| Task | Detail |
|------|--------|
| Type-check | ui-kit-root, email-root |
| Manual | Showcase + Email History in browser |

**Exit criteria:** Acceptance checklist below passes.

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.9.2 Add pagination to the UI-kit | 86ey3yh8p | Phases 1–3 |
| Define the pagination | 86ey3yjxz | Phase 1 |

---

## Acceptance checklist

- [ ] `Pagination` accepts `totalCount`, `currentPage`, `pageSize`, `onPageChange`
- [ ] First, previous, next, last, and page numbers work
- [ ] “Showing X–Y of Z” summary correct
- [ ] Page size selector (10, 25, 50) when `onPageSizeChange` provided
- [ ] Hidden when single page / zero results (default behavior)
- [ ] Responsive layout on mobile width
- [ ] Email History migrated to `Pagination`
- [ ] `npm run type-check -w ui-kit-root` and `email-root` pass

---

## Final verification commands

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w email-root
npm run dev:ui-kit
npm run dev:email
```
