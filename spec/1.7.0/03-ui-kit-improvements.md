# 03 — UI Kit improvements (dialogs, phone)

Follow-up subtask **86ey2yka6** — dialog patterns, strict delete confirms, and phone input showcase cleanup.

Cross-reference: [../1.3.0/05-dialogs.md](../1.3.0/05-dialogs.md).

---

## Delete confirmation — AlertDialog

| Before | After |
|--------|-------|
| Showcase delete demo uses `CustomDialog` with manual overlay/Escape guards | **`AlertDialog`** for strict non-dismissible delete confirm |

Showcase `DialogsPage` section **CustomDialog — delete confirmation** becomes **AlertDialog — delete confirmation** using `AlertDialog`, `AlertDialogContent`, `AlertDialogAction variant="destructive"`, etc.

Consumers should prefer **`AlertDialog`** when delete must not dismiss on overlay click or Escape without manual guards.

---

## Phone input showcase

| Before | After |
|--------|-------|
| Separate **Phone input** demo (`showCountrySelector={false}`) | **Removed** — platform standard is **`PhoneInput` with country selector** |

Keep showcase sections:

- **Phone input (with country)** — default product pattern
- **Phone input (with icon)** — optional icon + country selector

Remove the plain **Phone input** section without country from `ControlsPage.tsx`.

---

## Stacked dialogs (sibling pattern)

Nested dialogs must **not** render an inner `CustomDialog` as a **child** of another dialog's body. When opening a dialog from another dialog:

1. Render each dialog as a **sibling** at the same React tree level (fragment root).
2. Parent sets **`nestedDismissGuard={childOpen}`** so overlay/Escape dismisses the top dialog first.
3. Child dialog uses **`stackLevel={1}`** (or higher) so its overlay stacks **above** the parent with blur.

### CustomDialog API addition

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `stackLevel` | `number` | `0` | Increments overlay/content `z-index` (`100 + stackLevel * 10`) for stacked standalone dialogs |

### Showcase nested demo

Refactor `NestedDialogDemo` in `DialogsPage.tsx`:

- Outer and inner `CustomDialog` are **siblings**, not parent/child in JSX.
- Inner uses `stackLevel={1}`.

### Media crop over selector (Identity embed path)

When Identity opens **Select profile photo** (`ProfileMediaSelectorModal` → `MediaSelectorFrame` iframe), upload triggers **Crop Image** inside the Media selector page.

| File | Change |
|------|--------|
| `media/frontend/src/features/media/pages/SelectorPage.tsx` | Move `ImageCropDialog` to page root sibling (not inside scroll/content column) |
| `media/frontend/src/features/media/components/ImageCropDialog.tsx` | Pass `stackLevel={1}` to crop dialog |

Crop dialog stacks above selector content with its own overlay blur — same sibling/stack pattern as showcase nested demo.

---

## Files

| File | Action |
|------|--------|
| `ui-kit/package/src/components/CustomDialog.tsx` | Add `stackLevel` prop |
| `ui-kit/showcase/src/pages/DialogsPage.tsx` | AlertDialog delete; sibling nested demo |
| `ui-kit/showcase/src/pages/ControlsPage.tsx` | Remove plain phone input section |
| `media/frontend/src/features/media/pages/SelectorPage.tsx` | Sibling `ImageCropDialog` |
| `media/frontend/src/features/media/components/ImageCropDialog.tsx` | `stackLevel={1}` |

---

## Acceptance

- [ ] Delete confirmation showcase uses `AlertDialog` (strict confirm)
- [ ] Plain phone input demo (no country) removed from Controls tab
- [ ] Nested dialog showcase uses sibling `CustomDialog` instances + `stackLevel`
- [ ] Media selector crop opens as stacked sibling dialog over selector content
- [ ] `npm run build -w @webonone/ui-kit` and type-checks pass
