# Feedback 0025 — The AI chat window should be full width

| Field | Value |
|-------|-------|
| Ticket | `0025` |
| Feedback id | `PnKJI6e50npW5Ii7lhXKZ` |
| Type | `feature` |
| Title | The AI chat window should be full width. |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On desktop WebOnOne, the in-app AI assistant opens as a narrow right-hand rail (`AppEndPanel`, `max-w-sm`). Users need a way to expand that chat to fill the space between the left navigation and the right edge of the shell. Mobile already uses full-width slide-over and must stay unchanged.

## Problem / goal

**Problem:** Desktop AI chat is stuck in a slim right panel; long conversations and confirm cards feel cramped.

**Goal:** Add a desktop-only expand control (left of Close) that grows the assistant until it meets the left navigation, and keep that expanded width aligned when the sidebar collapses or expands.

## Acceptance criteria

1. Desktop (≥ `md`): assistant header shows an **expand** icon button immediately left of **Close**.
2. Clicking expand grows the panel so its left edge meets the left navigation (covers `#main-content`; does not cover the sidebar).
3. Expanded panel resizes with sidebar show/hide (collapsed `md:w-16` vs expanded `md:w-64`) without a separate layout mode.
4. Clicking expand again (or a collapse icon) returns the panel to the default narrow rail.
5. Expand control is **not** shown on mobile; mobile remains full-width via existing `mobileFullWidth`.
6. Closing the assistant resets expanded state for the next open.
7. Support help for the in-app assistant mentions the desktop expand control (`en` + `si`).
8. Touched workspaces pass type-check and lint (ui-kit, webonone-v2, support as needed).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | `AppEndPanel` expand API + desktop expanded layout CSS |
| `webonone-v2/frontend` | `AppAssistant` expand state + i18n labels |
| `support/frontend` | Help article update for expand |
| `spec/0025/` | This package |

## Out of scope

- Website guest `CatalogAssistant` expand
- Mobile native `AppAssistantPanel` / `@webonone/mobile-ui` `AppEndPanel`
- Changing peer filter `AppEndPanel` panels (opt-in expand only)
- Redesigning chat message layout or composer
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w support-root
```

Manual: `npm run dev:webonone` → open AI chat on desktop → expand → panel fills to nav → collapse sidebar → panel still meets nav → collapse chat → reopen is narrow rail. Resize below `md` → no expand button, full-width slide-over.
