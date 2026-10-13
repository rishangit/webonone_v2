# Feedback 0036 — Website location permission on refresh

| Field | Value |
|-------|-------|
| Ticket | `0036` |
| Feedback id | `VBclm-eCsM0eBUC9GOfOp` |
| Type | `bug` |
| Title | When refreshing the website always asks location permission |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The public website asks for location so nearby catalog cards can sort by distance. After the visitor allows precise location, a refresh should reuse that place. Today the in-app “Allow location access?” dialog (and, on browsers that cannot report permission state, a path that leads to the browser prompt) appears again on every load.

## Problem / goal

**Problem:** `useUserLocation` only remembers a dismiss for the current tab (`sessionStorage`). A successful GPS fix is not stored. On the next load the hook asks `navigator.permissions`. When that API reports `granted`, it reads location quietly. When the API is missing or throws (`unsupported`) — common outside Chromium — or still reports `prompt`, the hook opens `LocationPermissionDialog` again even though the visitor already allowed location in this browser.

**Goal:** After a successful precise-location read, store the coordinates and place label in `localStorage`. On later visits and refreshes, restore that place immediately and do not show the in-app permission dialog or call `getCurrentPosition` unless the browser permission is already `granted` (silent refresh) or the visitor explicitly refreshes location.

## Acceptance criteria

1. **Remember a successful fix** — After the visitor allows location and the site receives coordinates, those coordinates and the place label are saved in `localStorage` and survive a full page refresh and a new tab.
2. **No prompt when a saved fix exists** — Refreshing the home page (and catalog detail, which shares the hook) does not open the in-app location dialog when a saved precise location exists. The location bar shows that saved place without waiting on a new permission prompt.
3. **Silent update only when already allowed** — If the Permissions API reports `granted`, the site may refresh coordinates in the background without opening the in-app dialog. If the API reports `prompt` or is unsupported, the site keeps the saved place and does not call `getCurrentPosition` on load (that call is what shows the browser permission UI).
4. **Explicit refresh still works** — The location-bar refresh control still requests a new GPS reading from a click. “Not now” and a browser **Block** still fall back to approximate IP location and can show the unlock dialog when there is no saved precise fix.
5. **Denied clears the saved fix** — A `PERMISSION_DENIED` result removes the saved precise location so a blocked site does not keep presenting stale GPS as current.

## Services affected

| Area | Change |
|------|--------|
| `website/` frontend | `useUserLocation` persists and restores precise location |
| `spec/0036/` | This package |

## Out of scope

- Changing nearby-card layout or search
- A server-side location profile (no account required to browse)
- Support articles (bug fix; browse copy already says nearby cards use location or an approximate place)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```
