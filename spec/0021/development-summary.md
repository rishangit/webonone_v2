# Development summary — Feedback 0021

| Field | Value |
|-------|-------|
| Ticket | `0021` |
| Feedback id | `BAjos3vwt4mrJ2xo6Sgtl` |
| Title | company detail page improvements |
| Type | `feature` |
| Completed | `2026-10-05` |

## What was delivered

Company Overview now shows the logo inside the company profile card above the title (Identity profile pattern). The separate logo card and its Upload/Replace/Remove buttons are gone. Logo changes go through profile card Edit → wizard step 1 Media picker and save with the wizard. Mobile Overview matches the composition; Support and AI copy were updated.

## Where to see it

| Surface | How |
|---------|-----|
| Staging WebOnOne | Settings → My Companies (or Companies) → open a company → **Overview** — logo in profile card; Edit → step 1 to change logo |
| Support docs | `/docs/companies/logo-and-gallery` (en + si) |
| Local | `npm run dev:webonone` → same nav path; `npm run mobile` for native Overview |

## Feature details

- View: `ImagePreview` in `CompanyProfileCard` above name/status (web + mobile).
- Edit: wizard step 1 (existing company only) opens Media with 1:1 crop; `logoUrl` saved via company update.
- Create registration: no logo picker until the company exists (media scope needs company id).
- No Replace/Remove buttons on the details page.
- Gallery tab unchanged.

## Code and docs touched

| Area | Paths |
|------|-------|
| `webonone-v2/` | `CompanyProfileCard`, `CompanyFormDialog`, `CompanyWizardStepProfile`, Overview pages, deleted `CompanyLogoCard`, locales, AI capabilities |
| `mobile/` | `CompanyOverviewCards`, `CompanyDetailScreen` |
| `support/` | `logo-and-gallery.md` (en + si) |
| `spec/0021/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

## Deploy

| Item | Value |
|------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0021: company detail page improvements` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
