# 02 — ImagePreview Component

UI Kit composite for fixed-size image preview with optional edit overlay.

Location: `ui-kit/package/src/components/ImagePreview.tsx`

---

## API

```typescript
export type ImagePreviewMode = 'view' | 'edit'

export interface ImagePreviewProps {
  /** Image URL; null shows fallback */
  src: string | null
  alt: string
  /** Initials or short text when src is missing */
  fallback?: string
  mode?: ImagePreviewMode // default 'view'
  /** Called when user activates edit control (edit mode only) */
  onEdit?: () => void
  className?: string
}
```

---

## Layout and sizing

| Rule | Detail |
|------|--------|
| Fixed size | Root container **`h-40 w-40`** (Tailwind `w-40` / `h-40` = 10rem ≈ 160px) |
| Shape | **`rounded-lg`** (square with slight radius; consumers may pass `rounded-full` via `className` for avatars) |
| Image fit | **`object-cover`** filling the box; `overflow-hidden` on container |
| Fallback | When no `src`, centered **`Image`** icon (lucide) on `bg-muted` — first-upload empty state |
| Optional initials | `fallback` prop reserved for accessibility (`alt` context); not shown when icon empty state is used |

Note: ClickUp AC mentions "40 by 40 pixels" but specifies Tailwind classes **`w-40` and `h-40`** — implementation follows the **class names** (160×160 px), consistent with [1.5.0 profile spec](../1.5.0/02-identity-profile-page.md).

---

## Modes

| Mode | UI |
|------|-----|
| **view** | Image (or fallback) only; no overlay; not clickable unless consumer wraps it |
| **edit** | Same preview + **semi-transparent overlay** + **centered `Button`** with Pencil icon |

Edit overlay:

- `absolute inset-0 flex items-center justify-center`
- Overlay: `bg-black/35` (or theme-aware `bg-foreground/20` in light contexts)
- Button: `variant="secondary"`, `size="icon"`, centered via flex — **not** full-image ghost button (avoids accidental double handlers)
- `aria-label="Edit image"` (or consumer-provided via prop if needed later)

When `mode === 'edit'` and `onEdit` is provided, clicking the edit button invokes **`onEdit`**.

---

## Theme

Use design tokens only — no hard-coded hex except overlay alpha:

| Element | Classes |
|---------|---------|
| Border | `border border-border` |
| Fallback bg | `bg-muted text-muted-foreground` |
| Edit button | UI Kit `Button` secondary variant (inherits theme) |

Verify in showcase with system/light/dark theme toolbar.

---

## Media selector integration (consumer contract)

UI Kit **does not** embed Media. Consumers follow [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md):

```text
ImagePreview (edit mode, onEdit)
  → consumer opens CustomDialog + MediaSelectorFrame
  → postMessage select → consumer updates local src state
```

### Identity reference wiring

| File | Role |
|------|------|
| `ProfileAvatarEditor.tsx` | Renders `ImagePreview` with `mode="edit"`, `onEdit={onEditImage}` |
| `ProfileMediaSelectorModal.tsx` | Unchanged — opened by parent on `onEditImage` |
| `ProfileForm.tsx` | Orchestrates modal open state + pending `avatarUrl` |

---

## Showcase demo

Add section to **Components** tab (`ui-kit/showcase/src/pages/ComponentsPage.tsx` or dedicated demo file):

| Demo | Behavior |
|------|----------|
| With image | Sample photo URL in view and edit modes |
| Without image | `src={null}` — centered image icon empty state |
| Edit mode toggle | Switch between modes |
| Edit click | Toast: "Would open Media selector" (no Media dep in showcase) |

Optional: link to Media component showcase in Media service for full iframe demo.

---

## Files

| File | Action |
|------|--------|
| `ui-kit/package/src/components/ImagePreview.tsx` | **Create** |
| `ui-kit/package/src/index.ts` | Export `ImagePreview`, types |
| `ui-kit/showcase/src/pages/ComponentsPage.tsx` | Add demo section |
| `identity/frontend/src/features/profile/components/ProfileAvatarEditor.tsx` | Refactor to use `ImagePreview` (edit mode) |
| `identity/frontend/src/features/profile/components/ProfileView.tsx` | Use `ImagePreview` (view mode) for aligned profile image |

---

## Acceptance

- [ ] Fixed `w-40 h-40` in both modes
- [ ] Edit button visually centered on image in edit mode
- [ ] `onEdit` fires on edit button click
- [ ] Theme tokens used; no raw color literals except overlay alpha
- [ ] Identity profile edit → Media selector flow still works
- [ ] Showcase documents view vs edit
