# Plan — Feedback 0035

## Current behavior

`WebsiteLayout` wraps the site in `app-shell-root` with `p-2`. `AppHeader` is the full width of that shell. `WebsiteHomePage` then adds `px-4 sm:px-8` on the search/location band and on `<main>`, so home content is narrower than the header bar.

Nearby items render through `CatalogPublicItemCardGrid` → `ItemListCardGrid`, whose classes are `grid-cols-1` and `sm:grid-cols-1`, then `md:grid-cols-2` and wider. `cn` uses `tailwind-merge`, so a later `grid-cols-*` / `sm:grid-cols-*` on the home grid overrides only those breakpoints.

## Approach

Drop the extra horizontal padding on the home page chrome and main so the column lines up with the header bar. Keep vertical spacing. Pass a home-only grid class so nearby cards are two columns below `md`. Leave search results on the default grid. Mention the phone layout in the existing browse article.

## Implementation steps

1. **Home padding** — In `WebsiteHomePage.tsx`, remove `px-4` / `sm:px-8` from the search band and every `<main>` on this page so content matches the header bar width. Keep `pt-*` / `pb-*`.

2. **Two-up nearby cards** — In `NearbyHomeSection.tsx`, pass `className` on `CatalogPublicItemCardGrid` with `grid-cols-2 sm:grid-cols-2 py-0` so `tailwind-merge` replaces the one-column mobile/sm rules. Do not change `itemListCardGridClassName` (search and other lists stay one column on mobile).

3. **Support** — Add one sentence to `en` and `si` `public-catalog/browse-search.md`: on a phone, nearby cards span the header width and show two per row.

4. **Verify** — `npm run type-check -w website-root`, `npm run lint -w @webonone/website-frontend`, `npm run type-check -w support-root`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Two-up cards are narrower on a phone; titles already truncate.
- Search results stay one column on mobile so this stays home-scoped.
