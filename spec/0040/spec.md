# Feedback 0040 — Mobile view ui-kit tab behavior

| Field | Value |
|-------|-------|
| Ticket | `0040` |
| Feedback id | `vkF-nly-CL8OLoxHEo6_T` |
| Type | `bug` |
| Title | Mobile view ui-kit tab behavior |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On a narrow viewport the `@webonone/ui-kit` tab strip scrolls horizontally so extra tabs can be reached by swipe or click. After the user selects a tab that sits further along the strip, loading that tab’s panel moves the strip back to the start. The user has to swipe again to reach the selected tab or the next one.

## Problem / goal

**Problem:** `TabsList` keeps a horizontal scroll viewport. The first observation of the active tab does not scroll, and a later reflow (panel data load) can clamp `scrollLeft` to `0` without a tab-value change. The strip then shows the first tabs again even though a later tab is still selected.

**Goal:** After a tab is selected, the strip keeps that tab in the same horizontal position when its panel loads. Changing to a tab that is already fully visible does not move the strip. A tab that is off-screen when it becomes selected is brought into view.

## Acceptance criteria

1. **Stay put after load** — With more tabs than fit on a narrow screen, select a tab that required a horizontal swipe. When that tab’s content renders or reflows, the strip’s scroll offset stays where the user left it (the selected tab remains in view).
2. **No jump on an already visible tab** — Clicking a tab that is already fully inside the strip does not recenter or reset the strip.
3. **Off-screen selection** — Selecting a tab that is not fully visible scrolls that tab into view.
4. **Remount** — If the strip mounts while a later tab is already selected, that tab is shown in the strip (instant scroll), not left at the first tab.

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/` | `TabsList` scroll restore in `ui-kit/package/src/components/Tabs.tsx` |
| `spec/0040/` | This package |

## Out of scope

- Expo `@webonone/mobile-ui` tab strip
- Per-page tab state in WebOnOne, Data, or Identity
- New Support help articles (existing behavior, no new control)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
```
