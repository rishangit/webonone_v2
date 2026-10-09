# Plan — Feedback 0032

## Root cause

`BrandLogo` (`ui-kit/package/src/components/BrandLogo.tsx`) branches on `mark`:

- `mark` true (default): only `WebOnOneLogoMark`. `children` is dropped.
- `mark` false: text only.

Web headers pass either children (`<BrandLogo>WebOnOne</BrandLogo>`) or `alt` (`<BrandLogo mark alt={tShell('brand')} />` in `webonone-v2/frontend/src/app/AppLayout.tsx`). Both paths show the mark with no name. Mobile `AppHeader` renders `WebOnOneLogoMark` and never the `title` string.

## Approach

Render mark and wordmark together inside the existing flex row. Keep `mark={false}` as text-only. Mark the SVG decorative when the wordmark is on screen.

## Implementation steps

1. **`ui-kit/package/src/components/WebOnOneLogoMark.tsx`**
   - Add `decorative` so the SVG is `aria-hidden` and has no `<title>` when the wordmark is visible.

2. **`ui-kit/package/src/components/BrandLogo.tsx`**
   - Wordmark = `children`, else string `alt`, else `WebOnOne`.
   - `mark` true: mark (`decorative`) + wordmark span (`text-lg font-semibold tracking-tight text-foreground`) with `gap-2` on the link/wrapper.
   - `mark` false: unchanged text-only span.
   - Apply `className` on the wordmark span (current text-only behavior).

3. **`packages/mobile-ui/src/components/AppHeader.tsx`**
   - Row: decorative mark + `Subheading` (or equivalent) showing `title` (default `WebOnOne`) with a small gap.
   - Do not double-announce the name.

4. **Verify** — type-check `ui-kit-root` and `@webonone/mobile-ui`; lint `@webonone/ui-kit`.

No WebOnOne `AppLayout` edit: `alt={tShell('brand')}` becomes the visible wordmark via step 2.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `ui-kit` is a shared library: deploy detect should fan out to web services that ship the kit, not only `ui-kit`.
- Standalone satellite headers that pass a service name keep that name beside the mark.
- Support docs not required (visual bug fix, no workflow change).
