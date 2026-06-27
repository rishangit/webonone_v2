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
| Scope | `ui-kit/`, `identity/frontend`, `media/frontend` |

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
| Demo section | With-image + without-image (empty icon) side by side |
| Mode toggle + toast on edit | `useToast` from ui-kit |

**Exit criteria:** `npm run type-check -w ui-kit-root` passes.

---

## Phase 3 — Identity refactor

**Goal:** `ProfileAvatarEditor` uses `ImagePreview`.

| Task | Detail |
|------|--------|
| Refactor `ProfileAvatarEditor.tsx` | `ImagePreview` edit mode |
| Refactor `ProfileView.tsx` | `ImagePreview` view mode for aligned UI |

**Exit criteria:** Profile edit flow unchanged; type-check passes.

---

## Phase 4 — UI Kit dialog & phone improvements

**Goal:** AlertDialog delete confirm, sibling stacked nested dialogs, phone showcase cleanup, Media crop stacking.

| Task | Detail |
|------|--------|
| `CustomDialog` `stackLevel` | Higher z-index for stacked overlays |
| `DialogsPage` delete demo | Use `AlertDialog` strict confirm |
| `DialogsPage` nested demo | Sibling dialogs + `stackLevel` |
| `ControlsPage` | Remove plain PhoneInput section |
| `SelectorPage` + `ImageCropDialog` | Crop as sibling dialog with `stackLevel={1}` |

**Exit criteria:** Showcase + Media selector crop verified; type-check passes.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec 1.7.0 | 86ey2y7vc | All phases |
| UI-kit showcase, show the image preview component | 86ey2ya9p | 2–3 |
| UI-kit improvement | 86ey2yka6 | 4 |

---

## Acceptance checklist

- [ ] `ImagePreview` is `h-40 w-40` using Tailwind classes
- [ ] Edit mode: centered edit button on image
- [ ] Edit click opens Media selector (Identity profile verified manually)
- [ ] Theme-adaptive colors and spacing
- [ ] `npm run build -w @webonone/ui-kit` succeeds
- [ ] `npm run type-check -w ui-kit-root` succeeds
- [ ] `npm run type-check -w identity-root` succeeds
- [ ] Delete confirmation showcase uses `AlertDialog`
- [ ] Nested dialog showcase uses sibling stacking + `stackLevel`
- [ ] Media selector crop stacks above selector content

---

## Fixes required

_None at spec time._

---

## Open items

_None at spec time._
