# Feedback 0043 — Development summary

| Field | Value |
|-------|-------|
| Ticket | `0043` |
| Feedback id | `d3BSwt5-nzxF3zUJ1wBWk` |
| Title | Mobile dialog window footer button should not wrap |
| Type | `bug` |
| Completed | 2026-10-17 |

## What was delivered

Dialog window footer actions stay on one row on phone-width web and in the native app. Shared web chrome (`CustomDialog`, `DialogFooter`, `AlertDialogFooter`) is a nowrap row, and a direct footer row is forced to `flex-row` so stacked mobile footers no longer drop each button onto its own line. Button labels stay single-line. Native `CustomDialog` no longer uses `flex-wrap`, and button labels use one line. Wizard and form dialogs that had opted into `flex-wrap` (and the account / location prompts that stacked full-width actions) use the same one-row footer. A row that is wider than the dialog scrolls horizontally.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging web | Any dialog on phone width — e.g. WebOnOne company wizard, role chooser, website location prompt |
| Native app | Any `CustomDialog` footer (profile edit, calendar, staff, catalog pickers) |
| Support docs | None — layout-only bug |
| Local | `npm run dev:ui-kit` (dialogs showcase), `npm run dev:webonone`, `npm run mobile` |

## Feature details

- Footer actions stay on one horizontal row at every width.
- Labels do not wrap inside the button.
- Filter slide-over panels that stack full-width Apply / Clear are unchanged.
- List toolbars and in-dialog body controls that wrap on purpose are unchanged.

## Code and docs touched

| Area | Paths |
|------|--------|
| UI Kit | `ui-kit/package/src/components/CustomDialog.tsx`, `Dialog.tsx`, `AlertDialog.tsx` |
| Mobile UI | `packages/mobile-ui/src/components/CustomDialog.tsx`, `Button.tsx`, `CatalogReviewDialog.tsx`, `DateField.tsx` |
| WebOnOne, Data, Identity, Website | Dialog footer class names (`flex-nowrap`) |
| Mobile app | Dialog footer class names; account switch footer is one row on web too |
| Rules | `.cursor/rules/dialog-windows.mdc`, `.cursor/rules/mobile-dialogs.mdc` |
| Spec | `spec/0043/` |

## Verification run

```bash
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w data-root
npm run lint -w @webonone/data-frontend
npm run type-check -w identity-root
npm run lint -w @webonone/identity-frontend
npm run type-check -w website-root
npm run lint -w @webonone/website-frontend
```

`mobile` and `mobile-ui` have no lint script. Frontend lints that reported warnings were existing hook-deps warnings (0 errors).

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` returned `mode=none` / `empty git diff` because this fix was still uncommitted. The same file list (plus this summary) was detected with `--files`:

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0043: mobile dialog footer buttons stay one line` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | `ui-kit` shared library fans out to those IIS apps. `mobile-ui` has no IIS consumers. Direct edits under identity, webonone, data, and website are already in that set. |
| Detect command | `npm run deploy:detect -- --files <ticket file list> --print` (HEAD vs `origin/deploy_staging` was empty before this commit) |

## Support status

`developed` until the push to `deploy_staging` succeeds, then `staging`.
