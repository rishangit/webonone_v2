# Development summary — Feedback 0016

| Field | Value |
|-------|-------|
| Ticket | `0016` |
| Feedback id | `noKlEdnOz3SKZPVn2nPx7` |
| Title | Company logo needs to be shown in the overview tab |
| Type | `feature` |
| Completed | `2026-10-05` |

## What was delivered

Company logo (`CompanyLogoCard` / mobile logo section) now appears on the company profile **Overview** tab for owners and members, matching the profile-detail pattern of showing the entity image on the main overview surface. The logo card was removed from the **Gallery** tab so Gallery is gallery images only. Support help and AI tool copy were updated to point logo management at Overview.

## Where to see it

| Surface | How |
|---------|-----|
| Staging WebOnOne | Settings → My Companies (or Companies) → open a company → **Overview** (logo card); **Gallery** (images only) |
| Support docs | `/docs/companies/logo-and-gallery` (en + si) |
| Local | `npm run dev:webonone` → same company profile routes; mobile via `npm run mobile` company detail |

## Feature details

- Upload / replace / remove logo still uses the existing Media picker and `logoUrl` PATCH (no API change).
- Member / connected Overview shows the logo (edit gated by `canEdit`).
- Mobile Overview shows logo; Gallery panel is gallery-only; logo edit still prompts “Edit on web for now”.
- AI `register_company` / `update_company` descriptions reference Overview for logo and Gallery for gallery images.

## Code and docs touched

| Root | Paths |
|------|-------|
| `webonone-v2/frontend` | `CompanyProfilePage.tsx`, `CompanyMemberProfileView.tsx` |
| `webonone-v2/backend` | `src/ai/capabilities.ts` |
| `mobile/` | `CompanyOverviewCards.tsx`, `CompanyGalleryPanel.tsx`, `CompanyDetailScreen.tsx` |
| `support/frontend` | `content/en/companies/logo-and-gallery.md`, `content/si/companies/logo-and-gallery.md` |
| `spec/0016/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/webonone-frontend
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/webonone-backend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

## Deploy

| Item | Value |
|------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0016: show company logo on overview tab` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

After successful push: `staging` (`closed` remains super admin).
