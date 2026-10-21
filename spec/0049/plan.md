# Plan 0049 — Fix Media SelectorPage hooks order for CI lint

## Root cause

`media/frontend/src/features/media/pages/SelectorPage.tsx` early-returns when `embed.isEmbed && !accessToken` (auth spinner). A later `useEffect` (ResizeObserver → `MEDIA_MESSAGE_TYPES.CONTENT_SIZE`) sits **after** that return, so ESLint reports:

`React Hook "useEffect" is called conditionally` (`react-hooks/rules-of-hooks`) at line ~162.

CI runs `npm run lint` across workspaces; Media exits 1 and fails the pipeline.

## Fix

1. Move the content-size `useEffect` (and keep its deps: `contentNode`, `embed.listPage`, `embed.parentOrigin`) **above** the early return, with all other hooks.
2. Leave the effect’s internal guards (`!embed.listPage || !embed.parentOrigin || !contentNode`) unchanged so behavior stays the same when waiting for auth or when not in list-page mode.
3. Do not change upload, selection, or crop flows.

## Verification

```bash
npm run lint -w @webonone/media-frontend
npm run type-check -w media-root
```

Optional: confirm root lint no longer dies on Media (warnings elsewhere may still print).
