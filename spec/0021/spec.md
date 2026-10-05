# Feedback 0021 — Company detail page improvements

| Field | Value |
|-------|-------|
| Ticket | `0021` |
| Feedback id | `BAjos3vwt4mrJ2xo6Sgtl` |
| Type | `feature` |
| Title | company detail page improvements |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the company profile **Overview** tab, the logo currently lives in a separate `CompanyLogoCard` with Upload/Replace/Remove controls. Identity’s user profile shows the photo **inside** the Account card (above the name) and edits it only via that card’s Edit → wizard. Company profile should match that pattern.

## Problem / goal

**Problem:** Separate logo card + Replace/Remove buttons diverge from the user-profile pattern and clutter Overview.

**Goal:** Show the company logo inside the company profile card above the company title; remove the standalone logo card and its Replace/Remove buttons; change the logo only through the profile card Edit flow (wizard step 1), same as the user profile photo.

## Acceptance criteria

1. Company profile Overview (admin + member/owner) shows `ImagePreview` for `logoUrl` **inside** `CompanyProfileCard`, above the company title — layout aligned with Identity `ProfileView` (image + name/status block).
2. Standalone `CompanyLogoCard` is removed from Overview (and deleted if unused). No Upload / Replace / Remove buttons on the details page for the logo.
3. Profile card Edit opens the existing company wizard at step 1; step 1 includes an editable logo `ImagePreview` (Media picker, 1:1 crop) that saves with the wizard Submit — no immediate PATCH from the details page for logo alone.
4. Mobile company Overview mirrors the same composition (logo inside profile card; no separate logo section). Native logo Media picker may remain “edit on web” if the wizard still cannot host Media; view-only logo in the profile card is required.
5. Support `logo-and-gallery` (en + si) and AI tool copy that mention a separate Overview logo card are updated.
6. Touched workspaces pass type-check and lint.

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/` | Profile card + wizard step 1 + Overview layout; remove `CompanyLogoCard` |
| `mobile/` | Overview profile card includes logo; drop separate logo card |
| `support/` | Help article steps for logo upload |
| `spec/0021/` | This package |

## Out of scope

- Gallery tab / gallery images
- Backend API or schema changes (`logoUrl` already on update)
- New logo clear/remove UX beyond what Identity profile photo offers
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

Manual: My Companies → company → Overview — logo in profile card; Edit → wizard step 1 can change logo; no separate logo card or Replace/Remove.
