# 01 — Overview (1.7.0)

## Vision

Provide a **consistent, theme-aware image preview control** in UI Kit so any microservice frontend can show a fixed-size image with an optional edit overlay and wire the edit action to the **Media selector** embed (owned by the consumer, not UI Kit).

## User story

As a user, I want a consistent image preview with a fixed size, so I can easily view and edit images.

## Goals

1. Export **`ImagePreview`** from `@webonone/ui-kit` with fixed **`w-40 h-40`** display (160×160 px at default Tailwind scale).
2. Support **`view`** and **`edit`** modes; in edit mode show a **centered edit button** over the image.
3. **`onEdit`** callback when the edit control is activated — consumer opens Media selector dialog.
4. Use theme tokens (`border`, `muted`, `foreground`) so the control adapts to light/dark/system theme.
5. Refactor Identity profile avatar editor to use the shared component.
6. Add a showcase demo exercising view/edit toggle.
7. Dialog/phone showcase improvements: AlertDialog delete, remove plain PhoneInput demo, stacked sibling dialogs for nested flows and Media crop.
8. **`StatusTag`** component with semantic variants (pending, rejected, approved) and a **Tags** showcase tab.

## In scope

| Item | Detail |
|------|--------|
| `ImagePreview` component | `ui-kit/package/src/components/ImagePreview.tsx` |
| Public export | `ui-kit/package/src/index.ts` |
| Showcase demo | `ui-kit/showcase` — Components tab section |
| Identity refactor | `ProfileAvatarEditor` uses `ImagePreview` |
| Fallback display | Initials or placeholder when `src` is null |
| Dialog improvements | AlertDialog delete demo; sibling stacked dialogs; `stackLevel` on `CustomDialog` |
| Phone showcase | Remove plain PhoneInput demo; standardize on country selector |
| Media crop stacking | Selector embed crop dialog as sibling with `stackLevel={1}` |
| Status tags | `StatusTag` export; Tags showcase tab with group 1 variants |

## Out of scope

| Item | Reason |
|------|--------|
| Media selector inside UI Kit | Media is a separate microservice; consumers embed via `@webonone/media-embed` |
| Crop/upload logic | Owned by Media service ([1.4.0](../1.4.0/02-media-iframe-components.md)) |
| WebOnOne v2 changes | No product surface uses ImagePreview yet beyond Identity profile |
| Resizable preview | Fixed `w-40 h-40` per acceptance criteria |

## Glossary

| Term | Meaning |
|------|---------|
| **ImagePreview** | UI Kit composite: image + optional edit overlay |
| **View mode** | Read-only preview; no edit overlay |
| **Edit mode** | Centered pencil/edit button over image; click invokes `onEdit` |
| **StatusTag** | UI Kit inline label for workflow status (pending / rejected / approved) |

## Success criteria

1. `ImagePreview` renders at **`h-40 w-40`** in view and edit modes.
2. Edit mode shows centered edit control; clicking it calls **`onEdit`** once.
3. Identity profile edit flow unchanged functionally — Media selector still opens on edit.
4. Showcase demo toggles view/edit and documents consumer Media wiring pattern.
5. Theme switch (showcase toolbar) updates border/overlay colors correctly.
6. `npm run build -w @webonone/ui-kit` and `npm run type-check -w ui-kit-root` pass.
7. `npm run type-check -w identity-root` passes after refactor.
8. `StatusTag` variants render with glass surface and semantic borders in light/dark themes.
9. Showcase **Tags** tab documents group 1 status tags.
