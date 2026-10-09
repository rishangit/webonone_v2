# Development summary — Feedback 0032

| Field | Value |
|-------|-------|
| Ticket | `0032` |
| Feedback id | `daT0Cj_8K0zz6NTBB5W7w` |
| Title | Header needs to have the WebOnOne text |
| Type | `bug` |
| Completed | 2026-10-09 |

## What was delivered

The shared header logo now shows the product name to the right of the mark. `BrandLogo` renders the mark and a wordmark in one row (default **WebOnOne**, or `alt` / children when a caller passes a label). The mark is decorative when that text is visible. The Expo app header shows the same wordmark from its `title`.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging WebOnOne | https://staging.webonone.com — top header, right of the logo mark |
| Staging website | https://staging-website.webonone.com — site header |
| Staging Support | https://staging-support.webonone.com — help header |
| Local | `npm run dev:webonone` (FE :3010), `npm run dev:website`, `npm run dev:support` |
| Mobile | App header on the Expo shell (`npm run mobile`) |

Support docs: not updated (visual bug fix, no workflow change).

## Feature details

- Wordmark sits immediately to the right of the logo mark with a small gap.
- WebOnOne shell uses the translated brand string (`WebOnOne` in English and Sinhala) via `alt`.
- Headers that already pass children (`WebOnOne`, or a standalone satellite name such as Data) show that text beside the mark.
- `mark={false}` stays text-only.
- Screen readers hear the name once.

## Code and docs touched

| Area | Paths |
|------|--------|
| UI Kit | `ui-kit/package/src/components/BrandLogo.tsx`, `WebOnOneLogoMark.tsx` |
| Mobile UI | `packages/mobile-ui/src/components/AppHeader.tsx`, `WebOnOneLogoMark.tsx` |
| Spec | `spec/0032/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
```

All three exited 0. No browser session was running, so the header was not clicked through in a live app.

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` reported `mode=none` / empty diff because the fix was still uncommitted. Detection of the ticket paths (same script, `--files`) is what this commit will deploy:

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0032: Header needs to have the WebOnOne text` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | Shared library `ui-kit` fans out to those IIS apps. `mobile-ui` has no IIS consumers. `spec/` is ignored. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` (empty before commit); path list via `--files` for the table above |

## Support status

`developed` until push to `deploy_staging` succeeds, then `staging`. `closed` stays with super admin.
