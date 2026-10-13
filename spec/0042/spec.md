# Feedback 0042 — Design website media tab must use the user theme

| Field | Value |
|-------|-------|
| Ticket | `0042` |
| Feedback id | `XMRRMHdncqjr5DYsxdGBT` |
| Type | `bug` |
| Title | Design website design media need to apply the theme |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Design → Website → Media embeds the Media service selector (`/selector`) in an iframe. Media applies the platform color theme and UI theme from its own URL (`theme_v`, `theme_mode`, `theme_colors`, `ui_theme`) at startup. The Design page builds that URL with scope and folder only, so the iframe keeps Media’s default palette instead of the theme already applied on Design (query params, persisted theme, or CSS variables from the WebOnOne shell).

## Problem / goal

**Problem:** Opening the website Media tab shows media library chrome that does not match the signed-in user’s theme.

**Goal:** The Media iframe on that tab, and the crop dialog opened from it, start with the same color theme (palette + light/dark) and UI theme (classic / high-tech) as the Design page.

## Acceptance criteria

1. **Media tab** — The selector iframe URL includes the user’s applied color theme and UI theme before Media boots.
2. **Crop dialog** — The crop iframe opened from that tab uses the same theme query params.
3. **Source of theme** — Prefer theme query params on the Design page, then the persisted theme, then the colors and color mode already painted on `document.documentElement`.
4. **Unchanged contract** — Scope, folder, upload, and select/crop postMessage behavior stay as they are.

## Services affected

| Area | Change |
|------|--------|
| `design/` frontend | Theme query on website media embed URLs |
| `spec/0042/` | This package |

## Out of scope

- Media service theme engine (it already reads these query params)
- WebOnOne shell theme preferences API
- Website document / public-site theme tokens (designer canvas theme)
- Support articles (no change in how the tab is used)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
```
