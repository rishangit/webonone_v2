# Plan — Feedback 0041

## Current behavior

`AppLayout` wraps `BrandLogo` in a ghost `Button` (`h-auto gap-0 px-1`). Default `Button` size is `h-10 px-4 has-[svg]:px-6` (`ui-kit/package/src/components/button-variants.ts`).

`BrandLogo` with `mark` renders `WebOnOneLogoMark` (`svg`). The `:has(svg)` rule sets horizontal padding to `1.5rem`. That selector outranks `px-1`, so the override does not remove the gap. The header row already insets with `shellContentPaddingX` (`px-2 sm:px-6`).

## Approach

Keep the logo as a `Button`. Force zero horizontal padding with the important modifier so it wins over `has-[svg]:px-6`. Leave homepage click, aria-label, and header padding unchanged.

## Implementation steps

1. In `webonone-v2/frontend/src/app/AppLayout.tsx`, set the logo button class to `h-auto gap-0 !px-0 hover:bg-transparent`.
2. Verify with `npm run type-check -w webonone-v2-root` and `npm run lint -w @webonone/webonone-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `!px-0` is required because `className` on `Button` is merged with `clsx`, and `has-[svg]:px-6` has higher specificity than `px-0`.
- Ghost hover fill stays off (`hover:bg-transparent`) so the control does not paint a block behind the mark.
