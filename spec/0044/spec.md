# Feedback 0044 — Promote the Forms and Website menu items

| Field | Value |
|-------|-------|
| Ticket | `0044` |
| Feedback id | `fPa1BE31wTL8VuRQtz1pJ` |
| Type | `feature` |
| Title | Promote the Forms and Website menu items |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Company and super-admin left navigation nests **Forms** and **Website** under a **Design** group. Those two destinations should sit on the left menu as their own rows. The Design parent goes away. Routes, embed sentinels, and role rules stay the same.

## Problem / goal

**Problem:** Opening forms or the company website requires expanding Design first.

**Goal:** Remove the Design menu. Show Forms and Website as separate left-nav items in the same place the Design group occupied.

## Acceptance criteria

1. **Company and member nav** — Main and company-member menus list **Forms** and **Website** as top-level items (not a Design group). Forms still opens `/design/forms`; Website still opens `/design/website`.
2. **Super Admin** — Super Admin sees a top-level **Website** item and does not see Forms. Website still opens the shared library.
3. **Default user** — A member with no company still does not see Forms or Website (same gate that hid the Design group).
4. **Shells** — WebOnOne and the mobile drawer both render the promoted items. Standalone Design already lists Forms and Website at the top level and stays that way.
5. **Help** — English and Sinhala articles that tell users to open Design → Forms or Design → Website point at the top-level items.

## Services affected

| Area | Change |
|------|--------|
| `packages/platform-nav` | Replace Design groups with Forms and Website leaves; default-user filter |
| `webonone-v2/frontend` | Icons for the new top-level rows |
| `mobile/` | Drawer icons; Forms webview title |
| `support/` | Nav how-tos (`en` + `si`) |
| `spec/0044/` | This package |

## Out of scope

- Renaming the Design service, `/design/*` sentinels, or the Design product brand
- Changing who can open Forms or Website
- AI capability labels that mention Design forms
- Setting Support status `closed`

## Verification

```bash
npm run test -w @webonone/platform-nav
npm run type-check -w @webonone/platform-nav
npm run lint -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
