# Development summary — Feedback 0019

| Field | Value |
|-------|-------|
| Ticket | `0019` |
| Feedback id | `WxY6R1Xuqj6D22JAl5ndq` |
| Title | Mobile view body area needs increased width |
| Type | `bug` |
| Completed | `2026-10-05` |

## What was delivered

Removed the duplicate mobile horizontal inset on `FeaturePage` so list rows and details content match the AppHeader bar width below `sm`. Desktop (`sm:px-6`) and dialog overlay insets are unchanged. Support’s mirrored page padding token was updated to stay in sync.

## Where to see it

| Surface | How |
|---------|-----|
| Staging WebOnOne | Open any list or details page on a phone-width viewport; body cards align with the header bar edges |
| Local | `npm run dev:webonone` → narrow the browser → e.g. Companies / Staff list and a details page |
| Support help | No new article (layout padding fix only) |

## Feature details

- Mobile `shellPagePadding`: `px-0` (was `px-2`); vertical `py-4` unchanged.
- From `sm`: still `sm:px-6 sm:py-6`.
- Shell chrome `p-2` and AppHeader inner `px-2` unchanged.
- Applies to all AppShell `FeaturePage` consumers via `@webonone/ui-kit`.

## Code and docs touched

| Area | Paths |
|------|-------|
| ui-kit | `ui-kit/package/src/layouts/shellContentPadding.ts` |
| support | `support/frontend/src/features/shell/layout/shellLayout.ts` |
| rules | `.cursor/rules/feature-page-layout.mdc` |
| spec | `spec/0019/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0019: widen mobile FeaturePage body to header bar` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push to `deploy_staging` (`closed` remains super admin).
