# Development summary — Feedback 0042

| Field | Value |
|-------|-------|
| Ticket | `0042` |
| Feedback id | `XMRRMHdncqjr5DYsxdGBT` |
| Title | Design website design media need to apply the theme |
| Type | `bug` |
| Completed | 2026-10-13 |

## What was delivered

The Design website Media tab and the crop dialog opened from it pass the signed-in user’s color theme and UI theme on the Media iframe URL. Media already applies `theme_v`, `theme_mode`, `theme_colors`, and `ui_theme` at startup, so the library chrome matches Design instead of the default palette.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | WebOnOne → Design → Website → Media (`/design/website/media`). Crop dialog from upload on that tab. |
| Support docs | No article change |
| Local | `npm run dev:design` — `/website/media` (Design frontend port 3016) |

## Feature details

- Theme source order: Design page query params, then the persisted theme, then `--color-1`…`--color-5` and light/dark on the document.
- UI theme (`classic` / `high-tech`) is copied from the page query or persisted UI theme.
- Scope, folder (`/web`), upload, and select/crop messages are unchanged.
- The website image picker dialog is unchanged.

## Code and docs touched

| Area | Paths |
|------|--------|
| `design/` | `design/frontend/src/features/website/utils/mediaEmbedTheme.ts`, `pages/WebsiteMediaPage.tsx`, `components/WebsiteMediaCropDialog.tsx` |
| Spec | `spec/0042/spec.md`, `spec/0042/plan.md`, `spec/0042/development-summary.md` |

## Verification run

```bash
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
```

Both exited 0. No browser tool was available in this session, so the Media iframe was not opened in a running page.

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` returned `mode=none` / empty diff because the fix was still uncommitted. The same detector on the paths in this commit is the prediction CI will use after push:

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0042: apply user theme on website media` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | design |
| **Why** | `changed services: design` — `design/` only; `spec/` is ignored |
| Detect command | `npm run deploy:detect -- --files <path-list> --print` (HEAD diff was empty pre-commit) |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
