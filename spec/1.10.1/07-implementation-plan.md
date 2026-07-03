# 07 — Implementation Plan

Phased delivery for **1.10.1** on branch **`spec/1.10.1`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.10.1
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.10.1` |
| Scope | `ui-kit/`, `email/frontend/`, `webonone-v2/frontend/`, `media/frontend/`, `.cursor/rules/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.10.1/*` documentation
- [ ] Branch `spec/1.10.1`

---

## Phase 1 — UI Kit components

**Goal:** `ListFilterPanel` + `ListFilterTrigger` per [02-ui-kit-list-filter-panel.md](./02-ui-kit-list-filter-panel.md).

| Task | Detail |
|------|--------|
| `ListFilterPanel.tsx` | Slide-over panel, overlay, Apply/Clear |
| `ListFilterTrigger.tsx` | Icon button with `active` state |
| Export | `ui-kit/package/src/index.ts` |

**Exit criteria:** `npm run build -w @webonone/ui-kit` · `npm run type-check -w ui-kit-root`

---

## Phase 2 — Showcase demo

| Task | Detail |
|------|--------|
| `ComponentsPage.tsx` | List filters section with mock list |

**Exit criteria:** Showcase renders panel; type-check ui-kit-root.

---

## Phase 3 — Email rollout

| Task | Detail |
|------|--------|
| `HistoryPage.tsx` | Replace inline form with panel |
| `QueuePage.tsx` | Status filter in panel |
| `TemplatesPage.tsx` | Name/slug search in panel |
| `DashboardPage.tsx` | Recent activity filters in panel |

**Exit criteria:** `npm run type-check -w email-root`

Spec: [03-service-filter-rollout.md](./03-service-filter-rollout.md)

---

## Phase 4 — WebOnOne v2 rollout

| Task | Detail |
|------|--------|
| `CompaniesPage.tsx` | Name search panel |
| `SystemThemePage.tsx` | Theme name search panel |

**Exit criteria:** `npm run type-check -w webonone-v2-root`

---

## Phase 5 — Media rollout

| Task | Detail |
|------|--------|
| `ScopedFolderBrowser.tsx` | Filename / type filters in panel |

**Exit criteria:** `npm run type-check -w media-root`

---

## Phase 6 — Cursor rules

| Task | Detail |
|------|--------|
| `list-filter-panel.mdc` | New rule per [04-cursor-rules.md](./04-cursor-rules.md) |
| `item-list/SKILL.md` | Cross-link |
| `.cursor/rules/README.md` | Index |

---

## Phase 7 — ListSearchField (subtask delta)

**Goal:** Expandable header search left of filter trigger per subtask **86ey5e262**.

| Task | Detail |
|------|--------|
| `ListSearchField.tsx` | Collapsed search icon → expanded input with left search icon + clear |
| Export | `ui-kit/package/src/index.ts` |
| Rollout | Move text search from panels to header on all list pages |
| Showcase | Update Components list-filters demo |
| Rule | Update `list-filter-panel.mdc` |

**Exit criteria:** Search icon left of filter icon on every in-scope list page; type-check all service roots.

Spec: subtask **86ey5e262**

---

## Phase 8 — Search/filter layout fixes (subtask delta)

**Goal:** No filter-icon shift on search expand; mobile actions right-aligned; stable filter panel when scrollbars toggle.

| Task | Detail |
|------|--------|
| `ListSearchField.tsx` | Fixed `w-10` anchor; absolute expanded input |
| `PageHeader.tsx` | Mobile `justify-end` on actions |
| `ListFilterPanel.tsx` | Lock body overflow while open |

Spec: subtask **86ey5e4yu**

---

## Acceptance checklist

- [ ] UI Kit exports `ListFilterPanel` and `ListFilterTrigger`
- [ ] Showcase demo on Components tab
- [ ] All in-scope list pages use panel; triggers show active state
- [ ] Inline History filter form removed
- [ ] `list-filter-panel.mdc` indexed
- [ ] Type-check passes: ui-kit-root, email-root, webonone-v2-root, media-root

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.10.1 | 86ey58rda | Phases 1–6 |
| Subtask: search icon left of filter | 86ey5e262 | Phase 7 |
