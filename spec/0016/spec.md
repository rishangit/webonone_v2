# Feedback 0016 — Company logo needs to be shown in the overview tab

| Field | Value |
|-------|-------|
| Ticket | `0016` |
| Feedback id | `noKlEdnOz3SKZPVn2nPx7` |
| Type | `feature` |
| Title | Company logo needs to be shown in the overview tab |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Show the company logo on the company profile **Overview** tab (same role as the Identity profile avatar on the profile detail page), and stop showing the logo card on the **Gallery** tab. Gallery keeps gallery images only.

## Problem / goal

Today the logo lives only on the Gallery tab (`CompanyLogoCard` above `CompanyGalleryCard`). Overview shows profile/contact/location cards with no logo. Users expect the logo on Overview, like the Identity profile photo on the Account card.

**Goal:** Logo card on Overview; Gallery tab = gallery images only. Same behavior on web (WebOnOne) and mobile company detail. Support help and AI capability copy that say “logo under Gallery” must match the new placement.

## Acceptance criteria

1. Owner/admin company profile **Overview** tab renders `CompanyLogoCard` (upload/replace/remove when `canEdit`) using existing `logoUrl` — no API/schema change.
2. Owner/admin **Gallery** tab shows only `CompanyGalleryCard` (no logo card).
3. Member / connected company Overview shows the logo in view mode (`canEdit={false}`) when `logoUrl` is present or via the same card empty state.
4. Mobile company detail mirrors web: logo on Overview, removed from Gallery panel.
5. Support article `companies/logo-and-gallery` (en + si) tells users to manage the logo on Overview and gallery images on Gallery.
6. WebOnOne AI capability strings that point logo management at Gallery are updated to Overview.
7. `npm run type-check` / `npm run lint` pass for touched workspaces (`@webonone/webonone-frontend`, `@webonone/mobile`, `support-root` as applicable).

## Services affected

| Area | Change |
|------|--------|
| `webonone-v2/frontend` | `CompanyProfilePage`, `CompanyMemberProfileView`; AI `capabilities.ts` copy |
| `mobile/` | `CompanyOverviewTab` / `CompanyGalleryPanel` / `CompanyDetailScreen` |
| `support/frontend` | `en` + `si` `companies/logo-and-gallery.md` |
| `spec/0016/` | This package |

## Out of scope

- Changing `logoUrl` storage or Media picker/crop flow
- Folding logo into `CompanyProfileCard` / company wizard steps
- Public website branding beyond existing `logoUrl` consumers
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/webonone-frontend
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

Manual: My Companies → company → Overview shows logo card; Gallery has images only; connected company Overview shows logo read-only.
