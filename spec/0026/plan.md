# Plan — Feedback 0026

## Approach

Root cause: while Add is expanded, the window/`FeatureScreen` outside-press handler collapses Add on `pointerdown`/`touchStart` **before** Search’s click/`onPress`. Collapsing Add shifts the Search control, so the activating gesture never opens search (web) or a deferred outside handler closes search immediately after open (native).

Fix dismiss timing so in-toolbar Search activation runs first; keep mutual exclusivity via existing `open` / `openSearch` (already call `setAddExpanded(false)`).

## Implementation steps

1. **`ui-kit/package/src/layouts/PageHeader.tsx`**
   - In `handlePointerDown`: if the target is inside the header, **defer** `collapseAdd()` with `setTimeout(0)` so Search `onClick` → `open()` runs before layout shift; keep immediate `collapseAdd` + `close` for true outside presses.
   - Continue ignoring presses on `[data-list-add-button]`.

2. **`ui-kit/package/src/components/ListPageActions.tsx`**
   - Apply the same deferred in-toolbar `collapseAdd` in standalone `ListPageActions` (picker/embed toolbars without `PageHeader` context).

3. **`packages/mobile-ui/src/components/SearchInput.tsx`**
   - Stop calling `stopPropagation` on the compact Search icon `onTouchStart` so the press bubbles to `ListPageActions` `markInsidePress` (which stops propagation to `FeatureScreen` and sets `insidePressRef`).

4. **`packages/mobile-ui/src/components/ListPageActions.tsx`** (if needed)
   - Keep `insidePressRef` true until after the outside handler’s `setTimeout(0)` (clear with `setTimeout(0)` instead of `requestAnimationFrame`) so Search open is not cancelled by `emitListPageOutsidePress`.

5. **Verify** — type-check/lint ui-kit + mobile-ui; spot-check mobile list toolbar in showcase or a Data list page.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Deferred collapse must not leave Add stuck open when tapping Filter inside the toolbar — `setTimeout(0)` still collapses Add after the click.
- Do not defer true outside dismiss (immediate collapse + close search).
