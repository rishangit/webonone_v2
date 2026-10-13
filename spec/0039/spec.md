# Feedback 0039 — Add a link to open the WebOnOne homepage

| Field | Value |
|-------|-------|
| Ticket | `0039` |
| Feedback id | `E9Ztecxsysbr_qQ8lKyoT` |
| Type | `feature` |
| Title | Add a link to open the WebonOne homepage |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Signed-in users in the WebOnOne shell have no way from the header to leave the app for the public website. The header logo is not a link, and the avatar menu only offers Profile and Log out.

## Problem / goal

**Problem:** While using the app, opening the public WebOnOne homepage requires typing the website address. The logo and the user menu do not go there.

**Goal:** From a signed-in WebOnOne session, the avatar menu includes a Homepage item, and clicking the header logo goes to the same place. Both use the existing website auth-code handoff so the public site receives the current session.

Homepage means the public website origin root (`getWebsiteHomepageUrl()`), not the in-app Dashboard at `/`.

## Acceptance criteria

1. **Profile menu** — When the header shows a signed-in user, the avatar menu includes **Homepage** (Sinhala: **මුල් පිටුව**) after the profile block separator and before Profile.
2. **Logo** — Clicking the header WebOnOne logo starts the same navigation.
3. **Signed-in handoff** — Both actions call `redirectToWebsiteWithAuthCode` with `getWebsiteHomepageUrl()`. A failed handoff shows a destructive toast and leaves the user in the app.
4. **Help** — Support article `app-preferences/notifications` (English and Sinhala) mentions the logo and the Homepage menu item.

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/` | `AppShell` forwards optional `headerMenuItems` into `AppHeader` |
| `webonone-v2/` frontend | Logo click + menu item, `en`/`si` shell strings |
| `support/` | Help article update |
| `spec/0039/` | This package |

## Out of scope

- In-app Dashboard (`/`) and left-nav Dashboard
- Expo / `@webonone/mobile-ui` header
- Identity, Email, Data, and other satellite shells
- Changing website SSO itself
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w support-root
```
