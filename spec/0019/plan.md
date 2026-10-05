# Plan — Feedback 0019

## Approach

Remove the duplicate mobile horizontal inset on `FeaturePage` by changing the shared `shellPagePadding` token. Shell chrome (`p-2`) already insets the header bar and `#main-content`; page content should use that full main width on mobile so list/details align with the header bar. Keep `sm:px-6` for desktop alignment with the header inner row.

## Implementation steps

1. **`ui-kit/package/src/layouts/shellContentPadding.ts`**
   - Change `shellPagePadding` from `px-2 py-4 sm:px-6 sm:py-6` to `px-0 py-4 sm:px-6 sm:py-6`.
   - Leave `shellContentPaddingX`, `shellChromeRootClassName`, and `shellDialogOverlayClassName` unchanged.

2. **`support/frontend/src/features/shell/layout/shellLayout.ts`**
   - Mirror the same `shellPagePadding` string so Support docs pages stay consistent.

3. **`.cursor/rules/feature-page-layout.mdc`** (light touch)
   - Correct the horizontal-padding note: `FeaturePage` applies `shellPagePadding` (`px-0` mobile / `sm:px-6`); do not add extra `px-*` on page wrappers.

4. **Verify** — type-check/lint on ui-kit and support frontend.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- All AppShell `FeaturePage` consumers (WebOnOne, Data, Email, Media, peers) widen on mobile in one place — intended.
- Header logo/actions remain inset via `shellContentPaddingX` (`px-2`); only the **bar** width is the alignment target for body cards.
- Native mobile-ui not in scope unless a follow-up ticket requests it.
