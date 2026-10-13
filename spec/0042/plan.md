# Plan — Feedback 0042

## Current behavior

`WebsiteMediaPage` renders `MediaSelectorFrame` with `baseUrl` from `getMediaSelectorUrl()` (`{mediaOrigin}/selector`). `WebsiteMediaCropDialog` does the same for `/crop-dialog`.

`packages/media-embed` copies `parentOrigin`, `scope`, and folder onto that URL. It does not copy theme. Media `main.tsx` calls `applyThemeFromQueryParams` and `applyUiThemeFromQueryParams` only. Nested iframes also miss WebOnOne’s `broadcastThemeToIframes`, which posts only to direct child frames.

Design already rebuilds a `ThemePayload` for designer pop-out URLs in `navigateDesign.ts` (`appliedThemePayload`): query, then persisted theme, then `--color-1`…`--color-5` plus `dark` on `documentElement`.

## Approach

Add a website helper that returns a media base URL with the applied color theme and UI theme search params. Pass that URL as `baseUrl` for the media tab selector and its crop dialog. `buildMediaSelectorUrl` / `buildMediaCropDialogUrl` keep existing query keys when they add scope params.

Do not add a Design-wide iframe broadcaster. First paint is fixed by the URL Media already reads.

## Implementation steps

1. Add `design/frontend/src/features/website/utils/mediaEmbedTheme.ts` with `withAppliedUserTheme(baseUrl)`.
2. Use it in `WebsiteMediaPage` (`MediaSelectorFrame` `baseUrl`) and `WebsiteMediaCropDialog` (`MediaCropDialogFrame` `baseUrl`).
3. Verify with `npm run type-check -w design-root` and `npm run lint -w @webonone/design-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Theme colors read from CSS must already be hex (`#` optional). If they are not, skip the color payload and still relay `ui_theme` when present.
- Image picker dialogs are out of this ticket; they can call the same helper later.
