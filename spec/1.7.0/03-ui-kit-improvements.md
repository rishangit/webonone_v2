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

When Identity opens **Select profile photo**, upload-with-crop must stack in the **Identity document** — not inside the selector iframe (iframe `stackLevel` cannot overlay the consumer modal).

| Step | Detail |
|------|--------|
| 1 | Selector embed posts `webonone:media:crop-request` to parent with `File`, `scope`, `folderPath`, `cropAspectPresets` |
| 2 | [`ProfileMediaSelectorModal`](../../identity/frontend/src/features/profile/components/ProfileMediaSelectorModal.tsx) opens **sibling** inner `CustomDialog` (`stackLevel={1}`, extended `nestedDismissGuard` on outer) |
| 3 | Inner dialog hosts `MediaCropDialogFrame` → Media `/crop-dialog` route; **all** footer actions (Cancel, Crop & Upload) in consumer `CustomDialog` footer only — embed is body-only (`embedded` `ImageCropDialog`) |
| 4 | Parent sends JWT `init` + `crop-init` (file) to crop iframe; primary footer calls `sendMediaConfirm` |
| 5 | Crop confirm uploads and posts `webonone:media:select` → avatar updates |

**Dismiss guard:** inner Cancel must not close the outer selector — use `closeInnerDialog()`, `blockOuterDismiss` (~150ms after inner close), and extended `nestedDismissGuard` to block pointer fall-through. See [`.cursor/rules/dialog-windows.mdc`](../../.cursor/rules/dialog-windows.mdc) (**Inner close must not dismiss outer**).

| File | Change |
|------|--------|
| `packages/media-embed/` | `CROP_REQUEST`, `CROP_INIT`, `MediaCropDialogFrame`, `sendMediaCropInit`, `buildMediaCropDialogUrl` |
| `media/.../SelectorPage.tsx` | Embed mode: `postCropRequest` instead of local `ImageCropDialog` |
| `media/.../CropDialogPage.tsx` | Crop-only embed page (`embedded` `ImageCropDialog`) |
| `identity/.../ProfileMediaSelectorModal.tsx` | Sibling outer (selector) + inner (crop) `CustomDialog`s |

---

## Files

| File | Action |
|------|--------|
| `ui-kit/package/src/components/CustomDialog.tsx` | Add `stackLevel` prop |
| `ui-kit/showcase/src/pages/DialogsPage.tsx` | AlertDialog delete; sibling nested demo |
| `ui-kit/showcase/src/pages/ControlsPage.tsx` | Remove plain phone input section |
| `media/frontend/src/features/media/pages/CropDialogPage.tsx` | **Create** — crop embed route |
| `identity/frontend/.../ProfileMediaSelectorModal.tsx` | Sibling stacked dialogs + crop embed |
| `identity/frontend/.../mediaConfig.ts` | `getMediaCropDialogUrl()` |

---

## Acceptance

- [ ] Delete confirmation showcase uses `AlertDialog` (strict confirm)
- [ ] Plain phone input demo (no country) removed from Controls tab
- [ ] Nested dialog showcase uses sibling `CustomDialog` instances + `stackLevel`
- [ ] Identity profile crop opens as sibling `CustomDialog` in parent window (not clipped in selector iframe)
- [ ] `npm run build -w @webonone/ui-kit` and type-checks pass
