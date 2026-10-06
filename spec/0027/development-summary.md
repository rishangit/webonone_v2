# Development summary — Feedback 0027

| Field | Value |
|-------|-------|
| Ticket | `0027` |
| Feedback id | `shqOHusWEeTBtlR2EK9f6` |
| Title | Mobile view scroll bar needs to be aligned more to the right |
| Type | `bug` |
| Completed | `2026-10-05` |

## What was delivered

Mobile FeaturePage content keeps the 0019 left flush with the AppHeader bar and adds an 8px right inset (`pr-2`) so list rows and detail cards no longer sit under the themed scrollbar. AppShell `#main-content` and `PlatformEmbedShell` `<main>` also use `scrollbar-gutter-stable` so the thumb stays in a dedicated right lane. Support’s mirrored padding token and the feature-page layout rule were updated to match.

## Where to see it

| Surface | How |
|---------|-----|
| Staging WebOnOne | Phone-width viewport → any list or details page → scroll; scrollbar clears cards/rows on the right |
| Staging peer embed | Data/Email/etc. iframe list inside WebOnOne → same mobile clearance |
| Local | `npm run dev:webonone` (and optional `npm run dev:data`) → narrow browser → scroll Companies / catalog list and a details page |
| Support help | No new article (layout chrome only) |

## Feature details

- Mobile `shellPagePadding`: `pl-0 pr-2 py-4` (was `px-0 py-4`).
- From `sm`: still `sm:px-6 sm:py-6`.
- Scrollports: `#main-content` and `.platform-embed-shell-main` use `scrollbar-gutter-stable`.
- Applies to all AppShell / embed FeaturePage consumers via `@webonone/ui-kit` and `@webonone/platform-embed`.

## Code and docs touched

| Area | Paths |
|------|-------|
| ui-kit | `ui-kit/package/src/layouts/shellContentPadding.ts`, `AppShell.tsx` |
| platform-embed | `packages/platform-embed/src/PlatformEmbedShell.tsx` |
| support | `support/frontend/src/features/shell/layout/shellLayout.ts` |
| rules | `.cursor/rules/feature-page-layout.mdc` |
| spec | `spec/0027/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/platform-embed
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0027: clear mobile scrollbar from FeaturePage content` |
| Workflow | Push runs `.github/workflows/deploy-staging.yml` |
| **Expected mode** | `selective` |
| **Services** | `identity`, `webonone`, `media`, `email`, `data`, `sms`, `payment`, `website`, `design`, `ai`, `support` (all IIS keys) |
| **Why** | `ui-kit/` and `packages/platform-embed/` map to every IIS consumer; `support/` also changed; `spec/` and `.cursor/` ignored |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` |

**Deploy modes:** `selective` with all eleven services is not `deploy:all` — each site runs `deploy:<key>` so its frontend rebuilds bundled ui-kit/platform-embed. See `tooling/CICD.md`.

## Support status

`staging` after successful push to `deploy_staging` (`closed` remains super admin).
