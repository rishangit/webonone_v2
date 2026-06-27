# 07 — Implementation Plan

Phased delivery for **1.7.0** on branch **`spec/1.7.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.7.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.7.0` |
| Scope | `ui-kit/`, `identity/frontend` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.7.0/*` documentation
- [x] Branch `spec/1.7.0`

---

## Phase 1 — ImagePreview component (UI Kit)

**Goal:** Export `ImagePreview` with view/edit modes and theme-aware styling.

| Task | Detail |
|------|--------|
| Create `ImagePreview.tsx` | Fixed `h-40 w-40`, overlay, `onEdit` |
| Export from `index.ts` | Types + component |
| Build package | `npm run build -w @webonone/ui-kit` |

**Exit criteria:** Component builds; types exported.

---

## Phase 2 — Showcase demo

**Goal:** Components tab demo for view/edit toggle.

| Task | Detail |
|------|--------|
| Demo section | Toggle mode; toast on edit click |
| Theme check | Visible in light/dark |

**Exit criteria:** `npm run type-check -w ui-kit-root` passes.

---

## Phase 3 — Identity refactor

**Goal:** `ProfileAvatarEditor` uses `ImagePreview`.

| Task | Detail |
|------|--------|
| Refactor `ProfileAvatarEditor.tsx` | Replace inline Avatar+overlay |
| Preserve behavior | Click edit → parent opens Media modal |
| Optional `rounded-full` | Pass via `className` for avatar shape |

**Exit criteria:** Profile edit flow unchanged; type-check passes.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec 1.7.0 | 86ey2y7vc | All phases |

---

## Acceptance checklist

- [ ] `ImagePreview` is `h-40 w-40` using Tailwind classes
- [ ] Edit mode: centered edit button on image
- [ ] Edit click opens Media selector (Identity profile verified manually)
- [ ] Theme-adaptive colors and spacing
- [ ] `npm run build -w @webonone/ui-kit` succeeds
- [ ] `npm run type-check -w ui-kit-root` succeeds
- [ ] `npm run type-check -w identity-root` succeeds

---

## Fixes required

_None at spec time._

---

## Open items

_None at spec time._
