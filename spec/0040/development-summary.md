# Development summary — Feedback 0040

| Field | Value |
|-------|-------|
| Ticket | `0040` |
| Feedback id | `vkF-nly-CL8OLoxHEo6_T` |
| Title | Mobile view ui-kit tab behavior |
| Type | `bug` |
| Completed | 2026-10-13 |

## What was delivered

The narrow-screen tab strip in `@webonone/ui-kit` keeps its horizontal position after a selected tab’s panel loads. A reflow that clamps the strip back to the start is restored to the saved offset when the same tab is still selected. Clicking a tab that is already fully visible does not move the strip. Selecting a tab that is off-screen, or mounting with a later tab already selected, brings that tab into view.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | Any phone-width page that uses `Tabs` / `TabsList` (company profile sections, user details, support feedback status tabs) after the ui-kit consumers deploy |
| Support docs | No article change |
| Local | `npm run dev:ui-kit` — Controls page, “Many tabs” demo (`ui-kit/showcase`, port 3012) |

## Feature details

- Saved scroll offset is restored only when the strip jumps to `0` without a touch swipe or mouse-wheel gesture.
- Visibility uses the scroll viewport’s rectangle, so centering is not based on `offsetLeft`.
- Expo `@webonone/mobile-ui` tabs are unchanged.

## Code and docs touched

| Area | Paths |
|------|--------|
| `ui-kit/` | `ui-kit/package/src/components/Tabs.tsx` |
| Spec | `spec/0040/spec.md`, `spec/0040/plan.md`, `spec/0040/development-summary.md` |

## Verification run

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
```

Both exited 0. No browser tool was available in this session, so the swipe-and-load path was not clicked in a running page.

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` returned `mode=none` / empty diff because the fix was still uncommitted. The same detector on the paths in this commit (`ui-kit/package/src/components/Tabs.tsx` plus `spec/0040/`) is the prediction CI will use after push:

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0040: keep mobile tab strip position` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | `shared library ui-kit` — `ui-kit/` fans out to those IIS consumers; `spec/` is ignored |
| Detect command | `npm run deploy:detect -- --files <path-list> --print` (HEAD diff was empty pre-commit) |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`.
