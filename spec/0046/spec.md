# Feedback 0046 — Remove the unrelated add-form button on website submenu lists

| Field | Value |
|-------|-------|
| Ticket | `0046` |
| Feedback id | `LQcvX7IINxGDBKS4wejgm` |
| Type | `bug` |
| Title | Web page submenu item list page has not related button |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Website sections are left-nav submenu items. The Pages, Layouts, Headers, Footers, and Presets lists each show a create-form add button (`Add page`, `Add layout`, `Add header`, `Add footer`, `Add preset`) next to **Add from library** for a company admin. That create-form button is not the action for those lists. Company admins add by copying from the library or duplicating an existing row. Super Admin still uses the create-form button to maintain the shared library.

## Problem / goal

**Problem:** Company website submenu list pages show an add button that opens a blank create form. That button is not related to those lists.

**Goal:** Remove that create-form button for company admins on Pages, Layouts, Headers, Footers, and Presets. Keep **Add from library**, row **Duplicate**, and the Super Admin create-form button.

## Acceptance criteria

1. **Company admin (web)** — Pages, Layouts, Headers, Footers, and Presets lists do not show `Add page`, `Add layout`, `Add header`, `Add footer`, or `Add preset`. **Add from library** stays. Row **Duplicate** and edit still work.
2. **Super Admin (web)** — Those same lists still show the create-form add button. Super Admin does not see **Add from library**.
3. **Other website lists** — Themes, Data Sets, Media, and Settings are unchanged (their add actions stay).
4. **Mobile** — Company admin does not see the create-form add button on Pages, Layouts, Headers, Footers, or Presets. Super Admin still does.
5. **Help** — English and Sinhala articles that tell company admins to use the blank add button on those lists point at **Add from library** or **Duplicate** instead. Super Admin library maintenance stays documented.

## Services affected

| Area | Change |
|------|--------|
| `design/frontend` | Hide the create-form add button for company admins on the five library-backed lists |
| `mobile/` | Same gate on the matching screens |
| `support/` | Website how-tos (`en` + `si`) |
| `spec/0046/` | This package |

## Out of scope

- Removing **Add from library**
- Themes, Data Sets, Media, and Settings add actions
- Designer add-on or menu-item buttons
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
