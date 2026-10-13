# Plan — Feedback 0037

## Current behavior

Homepage item cards render through `CatalogPublicItemCardGrid` → UI Kit `ItemListCardGrid`.

Default grid classes (`itemListCardGridClassName`):

```text
grid grid-cols-1 items-stretch gap-3 py-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
```

| Surface | Extra classes | Result below `md` |
|---------|---------------|-------------------|
| Nearby home (`NearbyHomeSection`) | `grid-cols-2 py-0 sm:grid-cols-2` | Two columns, `gap-3` |
| Search results (`CatalogSearchResults`) | none (`py-0` fallback) | One column, `gap-3` |

`tailwind-merge` lets a later `gap-*` replace the kit `gap-3`. Responsive `md:gap-3` does not conflict with an unprefixed `gap-2`.

## Approach

Pass `gap-2 md:gap-3` on both homepage grids. Do not change the UI Kit default, so admin collection grids stay at `gap-3`.

## Implementation steps

1. **Nearby home** — In `NearbyHomeSection.tsx`, extend the grid `className` to `grid-cols-2 gap-2 py-0 sm:grid-cols-2 md:gap-3`.
2. **Home search results** — In `CatalogSearchResults.tsx`, pass `className="gap-2 py-0 md:gap-3"` into `CatalogPublicItemCardGrid`.
3. **Verify** — `npm run type-check -w website-root` and `npm run lint -w @webonone/website-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `gap-2` is one step tighter than `gap-3` (12px → 8px). Column counts are unchanged.
- Support docs are not required for this spacing change.
