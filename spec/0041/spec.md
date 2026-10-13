# Feedback 0041 — Extra space on the left of the header logo

| Field | Value |
|-------|-------|
| Ticket | `0041` |
| Feedback id | `kqzLPEzUonaHsIQHoW91B` |
| Type | `bug` |
| Title | Can see the extra space in logo left side |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The signed-in WebOnOne header logo is a button so a click can open the public homepage. That button uses the default size, which adds `px-6` whenever the control contains an SVG. The logo mark is an SVG, so a wide gap appears on the left of the mark (and the same padding on the right).

## Problem / goal

**Problem:** The header logo does not sit against the header content inset. Extra horizontal padding shows on the left of the mark.

**Goal:** The logo control has no extra horizontal padding. The mark lines up with the header row’s existing inset (`px-2` below `sm`, `sm:px-6`), the same alignment the wordmark had before the click target was a padded button. Homepage click behavior stays as it is.

## Acceptance criteria

1. **Left inset** — The header logo mark has no button padding on its left. Default `Button` size `has-[svg]:px-6` does not apply to this control.
2. **Alignment** — Horizontal position matches the header content padding only (`shellContentPaddingX`), with no second inset from the logo control.
3. **Click** — The logo remains a button that opens the public homepage (auth-code handoff). Accessible name stays the homepage label.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/` frontend | Logo button classes in `AppLayout` |
| `spec/0041/` | This package |

## Out of scope

- Header row padding (`shellContentPaddingX`)
- Satellite shells (Identity, Email, Data, and others) that render `BrandLogo` without this button
- Public website header
- SVG viewBox of `WebOnOneLogoMark`
- Support articles (no change in how the logo is used)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
```
