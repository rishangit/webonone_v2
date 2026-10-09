# Feedback 0032 — Header needs to have the WebOnOne text

| Field | Value |
|-------|-------|
| Ticket | `0032` |
| Feedback id | `daT0Cj_8K0zz6NTBB5W7w` |
| Type | `bug` |
| Title | Header needs to have the WebOnOne text |
| Reporter | n.rishee@gmail.com |
| Attachment | none |

## Overview

App headers show the WebOnOne logo mark with no product name beside it. The wordmark must sit immediately to the right of the mark.

## Problem / goal

**Problem:** `BrandLogo` treats `mark` (default `true`) as mark-only and ignores `children`. Call sites that pass `WebOnOne` (website, support, satellite platform shells) and the WebOnOne shell that only sets `alt` therefore render the SVG alone. The mobile app header does the same: `title` is an accessibility label on the mark, not visible text.

**Goal:** Every product header that uses the shared logo shows the wordmark to the right of the mark. Default wordmark is **WebOnOne**. A caller that passes other text (standalone satellite name) keeps that text beside the mark.

## Acceptance criteria

1. **Wordmark beside the mark** — With `mark` enabled, `BrandLogo` renders the logo mark and the wordmark in one row, text on the right, with a small gap.
2. **Default name** — When no children are passed, the visible wordmark is `alt` when it is a string, otherwise `WebOnOne`.
3. **Existing labels** — Children such as `WebOnOne`, a translated brand string, or a standalone service name (`Data`, `Email`, …) render as that wordmark, not as a replacement that hides the mark.
4. **Text-only mode** — `mark={false}` still renders text only (no mark).
5. **Accessible name once** — When the wordmark is visible, the mark is decorative so the name is not announced twice.
6. **Mobile header** — The Expo `AppHeader` shows the same wordmark (`title`, default `WebOnOne`) to the right of the mark.
7. **No help-article change** — This is a visual bug fix; Support how-tos stay as-is.

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | `BrandLogo` wordmark layout; decorative logo mark |
| `packages/mobile-ui` | `AppHeader` wordmark next to the mark |
| `spec/0032/` | This package |

## Out of scope

- Redesigning the logo SVG or header chrome (nav, profile, locale)
- Replacing standalone satellite names (`Data`, `SMS`, …) with `WebOnOne`
- Support article updates
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
```
