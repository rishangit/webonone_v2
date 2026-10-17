# Feedback 0045 — Keep all tabs under the website’s main menus

| Field | Value |
|-------|-------|
| Ticket | `0045` |
| Feedback id | `Zdn72lmkWnfD3sXHM6uPD` |
| Type | `feature` |
| Title | Keep all tabs under the website’s main menus |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Website is a top-level left-nav item. Inside it, Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, Media, and Settings are horizontal tabs on one hub. Those tabs should be submenu items under **Website**. Choosing one opens that section’s existing list (or settings) page. The tab strip goes away.

## Problem / goal

**Problem:** Website sections live in a tab bar on the page instead of the left menu.

**Goal:** Expand **Website** in the left navigation and open each section as its own list page.

## Acceptance criteria

1. **Company and member nav** — Website is a group. Children, in order: Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, Media, Settings. Each opens the matching route (`/design/website/pages`, … `/design/website/settings` in the shell; `/website/…` on Design).
2. **Super Admin** — Website is a group with Pages, Layouts, Headers, Footers, Presets, and Themes only (same sections the hub tabs already hid: no Data Sets, Media, or Settings).
3. **Default user** — A member with no company still does not see Website.
4. **List pages** — Each child still shows that section’s list (or the settings / media page). The horizontal section tab bar is gone. Search, filter, and add stay on the list pages.
5. **Shells** — WebOnOne, standalone Design, and the mobile drawer all use the Website group. Editing a page, header, footer, preset, or theme still highlights the matching submenu item.
6. **Help** — English and Sinhala articles that say to open a Website tab point at the left-nav item instead.

## Services affected

| Area | Change |
|------|--------|
| `packages/platform-nav` | Website leaf becomes a group; default-user filter treats Website as a group |
| `packages/i18n` | Nav label keys for the new children (`en` + `si`) |
| `webonone-v2/frontend` | Icons for the Website group and children |
| `design/frontend` | Standalone Website group; remove hub tabs |
| `identity/`, `email/`, `data/` frontends | Core-nav icons for Website children |
| `mobile/` | Drawer icons; remove hub tabs |
| `support/` | Website how-tos (`en` + `si`) |
| `spec/0045/` | This package |

## Out of scope

- Redesigning list rows, designers, or theme-editor tabs
- Changing who can open each section
- New website sections
- Setting Support status `closed`

## Verification

```bash
npm run test -w @webonone/platform-nav
npm run type-check -w @webonone/platform-nav
npm run lint -w @webonone/platform-nav
npm run type-check -w @webonone/i18n
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w identity-root
npm run type-check -w email-root
npm run type-check -w data-root
npm run type-check -w support-root
```
