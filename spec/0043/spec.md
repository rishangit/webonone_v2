# Feedback 0043 — Mobile dialog window footer button should not wrap

| Field | Value |
|-------|-------|
| Ticket | `0043` |
| Feedback id | `d3BSwt5-nzxF3zUJ1wBWk` |
| Type | `bug` |
| Title | Mobile dialog window footer button should not wrap |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Dialog footers on a phone-width browser and in the Expo app put action buttons on a second line. Web `CustomDialog` consumers wrap wizard actions in `flex-wrap`. `DialogFooter` and `AlertDialogFooter` stack actions with `flex-col-reverse` below `sm`. Native `CustomDialog` and many dialog `footer` views use `flex-wrap`, and button labels can break inside a fixed-height control.

## Problem / goal

**Problem:** Cancel, Previous, Next, and Save (and the same actions on other dialogs) wrap onto two lines in mobile web and native dialog windows.

**Goal:** Every dialog window footer keeps its action buttons on one row, and each button label stays on one line, on phone-width web and in the native app.

## Acceptance criteria

1. **Web dialog chrome** — `CustomDialog`, `DialogFooter`, and `AlertDialogFooter` lay footer actions out in one horizontal row at every width, including below `sm`.
2. **Web dialog footers** — Wizard and form dialogs that wrap footer buttons in `flex-wrap` keep those buttons on one row on a phone-width viewport.
3. **Native dialog chrome** — `CustomDialog` footer does not wrap its children, and button labels do not wrap inside the button.
4. **Native dialog footers** — Dialog `footer` rows that use `flex-wrap` stay one row.
5. **Unchanged elsewhere** — List toolbars, filter panels, and non-dialog `flex-wrap` rows are unchanged. Slide-over panels that stack full-width actions stay stacked.

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/` | Dialog footer layout |
| `packages/mobile-ui/` | Native dialog footer and button label |
| `webonone-v2/`, `data/`, `identity/` frontends | Dialog footer rows that opted into wrap |
| `mobile/` | Dialog footer rows that opted into wrap |
| `.cursor/rules/dialog-windows.mdc`, `.cursor/rules/mobile-dialogs.mdc` | Footer rule matches one-row actions |
| `spec/0043/` | This package |

## Out of scope

- App end-panel / filter-panel footers that intentionally stack full-width Apply and Clear
- Non-dialog toolbars (search, list actions, page headers)
- Support articles (layout bug; how dialogs are used does not change)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
npm run lint -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w data-root
npm run lint -w @webonone/data-frontend
npm run type-check -w identity-root
npm run lint -w @webonone/identity-frontend
```
