# Plan — Feedback 0027

## Approach

Keep 0019’s mobile left flush (`pl-0`) so body width still matches the AppHeader bar. Restore a small **right-only** mobile inset on the shared `shellPagePadding` token equal to the themed scrollbar width (`pr-2` = 8px, matching `globals.css` scrollbar `width: 8px`). That clears overlay and classic scroll thumbs from cards/lists without undoing left alignment.

Also reserve a stable scrollbar gutter on the two product scrollports (`#main-content`, `PlatformEmbedShell` `<main>`) so the thumb stays in a dedicated lane at the far right and layout does not jump when overflow appears.

## Implementation steps

1. **`ui-kit/package/src/layouts/shellContentPadding.ts`**
  - Change `shellPagePadding` from `px-0 py-4 sm:px-6 sm:py-6` to `pl-0 pr-2 py-4 sm:px-6 sm:py-6`.
  - Update the comment to document asymmetric mobile padding (left flush / right scrollbar clearance).

2. **`ui-kit/package/src/layouts/AppShell.tsx`**
  - On non-embed `#main-content`, add `scrollbar-gutter-stable` next to `overflow-y-auto scrollbar-themed`.

3. **`packages/platform-embed/src/PlatformEmbedShell.tsx`**
  - Add `scrollbar-gutter-stable` on the scrolling `<main>` class list.

4. **`support/frontend/src/features/shell/layout/shellLayout.ts`**
  - Mirror the same `shellPagePadding` string.

5. **`.cursor/rules/feature-page-layout.mdc`**
  - Update the horizontal-padding note: mobile `pl-0 pr-2` / `sm:px-6`.

6. **Verify** — type-check/lint on touched workspaces; manual narrow-viewport scroll check.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Asymmetric mobile padding is intentional; do not “fix” it by restoring `px-2`.
- `scrollbar-gutter: stable` always reserves a thin right strip even when content is short — acceptable and matches Dialog scroll bodies.
- No help article (layout chrome only).
