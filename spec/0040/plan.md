# Plan — Feedback 0040

## Current behavior

`ui-kit/package/src/components/Tabs.tsx` wraps the Radix tab list in an `overflow-x-auto` viewport and adds touch swipe via `useTabsListTouchScroll`.

A layout effect reads the active tab once and **returns without scrolling** so the first paint stays at the start. A `MutationObserver` on `data-state` recenters the active tab only when its value string changes. It uses `offsetLeft`, which is relative to `offsetParent`, not the scroll viewport.

When panel content loads, the strip’s layout can clamp `scrollLeft` to `0` while the selected value stays the same. Nothing restores the offset, so the user must swipe again. A remount hits the same first-paint skip.

## Approach

Keep the selected tab’s horizontal place inside `TabsList`:

- Measure visibility with `getBoundingClientRect` against the scroll viewport.
- Remember `scrollLeft` from user scrolling.
- If the same tab is still selected and the viewport jumps back to `0` without a touch, pointer, or wheel gesture, restore the saved offset instantly.
- If the active value changes and that tab is not fully visible, center it. If it is already fully visible, leave the offset alone.
- On first observation, center only when the active tab is not fully visible (covers remount with a later tab already selected).

## Implementation steps

1. In `TabsList`, replace `offsetLeft` centering with viewport-relative math.
2. Restore a saved `scrollLeft` when the strip resets to `0` for the same tab outside a user scroll gesture.
3. Scroll into view on value change or first paint only when the active tab is not fully visible.
4. Verify with `npm run type-check -w ui-kit-root` and `npm run lint -w @webonone/ui-kit`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- A user who flicks the strip back to the start while the selected tab is off-screen must not be snapped back. Restore runs only when there is no active touch, pointer, or wheel gesture.
- Centering an off-screen tab still moves the strip; that is the selection path, not the load path.
