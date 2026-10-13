# Development summary — Feedback 0039

| Field | Value |
|-------|-------|
| Ticket | `0039` |
| Feedback id | `E9Ztecxsysbr_qQ8lKyoT` |
| Title | Add a link to open the WebonOne homepage |
| Type | `feature` |
| Completed | 2026-10-13 |

## What was delivered

Signed-in WebOnOne users can open the public website homepage from the header. The avatar menu has a **Homepage** item (Sinhala **මුල් පිටුව**) before Profile, and the header logo uses the same action. Both hand the current session to the website with `redirectToWebsiteWithAuthCode` and `getWebsiteHomepageUrl()`. A failed handoff shows a destructive toast and stays in the app. The header help article describes both controls.

## Where to see it

| Surface | Path |
|---------|------|
| Staging app | https://app.webonone.com — header logo, or avatar → Homepage |
| Support | https://support.webonone.com/docs/app-preferences/notifications |
| Local | `npm run dev:webonone` — http://127.0.0.1:3010 (signed in) |

## Feature details

- Homepage is the public website origin root, not the in-app Dashboard at `/`.
- Same-tab auth-code handoff; the logo is a button, not a raw website URL.
- Shown for every signed-in shell session (the app layout is behind the private route).
- Expo header is unchanged.

## Code and docs touched

| Area | Paths |
|------|-------|
| UI Kit | `ui-kit/package/src/layouts/AppShell.tsx` (`headerMenuItems`) |
| WebOnOne | `webonone-v2/frontend/src/app/AppLayout.tsx`, `locales/en/shell.json`, `locales/si/shell.json` |
| Support | `support/frontend/src/content/en/app-preferences/notifications.md`, `si/app-preferences/notifications.md` |
| Spec | `spec/0039/` |

## Verification run

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run build -w @webonone/ui-kit
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w support-root
```

`ui-kit` and `webonone` type-check passed. `webonone` lint reported 0 errors (existing hook warnings in unrelated lists). Support type-check passed. The signed-in header was not clicked in a browser in this session (no running app and no browser tool).

## Deploy

Pre-commit `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` / empty diff because these edits were still uncommitted. Detect on the paths in this commit (same command’s path rules, including `spec/0039/development-summary.md`) is the expected post-push result.

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0039: add homepage link in the header` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | shared library `ui-kit` fans out to those IIS consumers; `webonone-v2/` and `support/` are included in that set |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit; path detect matched the table) |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
