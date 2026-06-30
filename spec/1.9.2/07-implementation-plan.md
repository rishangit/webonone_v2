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
| Scope | `ui-kit/`, `email/frontend/`, `webonone-v2/frontend/`, `media/frontend/`, `.cursor/rules/` |

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

## Phase 4 — Components tab showcase

**Goal:** Pagination demo on Components tab with ItemList ([03-showcase-components-pagination.md](./03-showcase-components-pagination.md)).

| Task | Detail |
|------|--------|
| `ComponentsPage.tsx` | ItemList + `Pagination` demo section |
| `ControlsPage.tsx` | Remove Pagination section |

**Exit criteria:** Type-check ui-kit.

Spec: subtask **86ey3ypk3**

---

## Phase 5 — Service pagination rollout

**Goal:** All in-scope list pages use `Pagination` ([04-service-pagination-rollout.md](./04-service-pagination-rollout.md)).

| Task | Detail |
|------|--------|
| Email `QueuePage` | Server pagination via `listQueue` |
| Email `TemplatesPage` | Client-side slice + `Pagination` |
| WebOnOne `CompaniesPage` | Client-side slice + `Pagination` |
| WebOnOne `SystemThemePage` | Client-side slice on themes + `Pagination` |
| Media `ScopedFolderBrowser` | API pagination for media items |

**Exit criteria:** Type-check email-root, webonone-v2-root, media-root.

Spec: subtask **86ey3ykth**

---

## Phase 6 — Cursor rule

| Task | Detail |
|------|--------|
| `item-list-pagination.mdc` | New rule; index in README |
| `item-list/SKILL.md` | Cross-link + checklist |

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
| need to add the pagination to the ui-kit component show case | 86ey3ypk3 | Phase 4 |
| Implement the pagination to the services | 86ey3ykth | Phases 5–6 |

---

## Acceptance checklist

- [ ] `Pagination` accepts `totalCount`, `currentPage`, `pageSize`, `onPageChange`
- [ ] First, previous, next, last, and page numbers work
- [ ] “Showing X–Y of Z” summary correct
- [ ] Page size selector (10, 25, 50) when `onPageSizeChange` provided
- [ ] Hidden when single page / zero results (default behavior)
- [ ] Responsive layout on mobile width
- [ ] Email History migrated to `Pagination`
- [ ] Components tab: ItemList + Pagination demo
- [ ] Email Queue, Templates paginated
- [ ] WebOnOne Companies and System Theme lists paginated
- [ ] Media folder browser paginates media items
- [ ] `item-list-pagination.mdc` rule added
- [ ] `npm run type-check -w ui-kit-root`, `email-root`, `webonone-v2-root`, `media-root` pass

---

## Final verification commands

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w email-root
npm run type-check -w webonone-v2-root
npm run type-check -w media-root
npm run dev:ui-kit
npm run dev:email
```
