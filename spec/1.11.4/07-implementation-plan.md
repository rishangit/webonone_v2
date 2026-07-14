# 07 — Implementation Plan

Phased delivery for **1.11.4** on branch **`spec/1.11.4`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.11.4
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.11.4` |
| Scope | `ui-kit/showcase/` primarily; `ui-kit/package/` only if a demo gap requires a small export fix |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.11.4/*` documentation
- [ ] Branch `spec/1.11.4` pushed with implementation (build phase)

---

## Phase 1 — Pages tab + List / Details demos

**Goal:** [02-pages-tab-showcase.md](./02-pages-tab-showcase.md)

| Task | Detail |
|------|--------|
| Register tab | `showcase-nav.ts` — `pages` |
| Wire host | `ShowcaseApp.tsx` — Pages content |
| Nested tabs | `PagesPage.tsx` — List page / Details page |
| List composition | FeaturePage + search/filter + ListPageBody + ItemList + Pagination |
| Details composition | FeaturePage + form fields + actions + sample error state |
| Hash | `#pages` (extend for nested if straightforward) |

**Exit criteria:** Manual check on `npm run dev:ui-kit`; type-check `ui-kit-root`.

Spec: subtask **86ey9pkzn**

---

## Acceptance checklist

- [ ] Showcase top nav includes **Pages**
- [ ] Nested **List page** and **Details page** tabs under Pages
- [ ] List demo includes all required list building blocks (search, filter, ItemList menu/active/empty, ListPageBody, Pagination 12 / [12,24,48])
- [ ] Details demo includes FeaturePage + representative form controls
- [ ] Existing showcase tabs unchanged in behavior
- [ ] `npm run type-check -w ui-kit-root`
- [ ] `npm run build -w @webonone/ui-kit`

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.11.4 Ui-Kit improvement | 86ey9pkp2 | All phases |
| Subtask: Need to have the pages tab in the UI kits show case | 86ey9pkzn | Phase 1 |

---

## Final verification (build)

```bash
npm run type-check -w ui-kit-root
npm run build -w @webonone/ui-kit
npm run lint -w ui-kit-root
```
