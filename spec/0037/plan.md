# Plan — Feedback 0037

## Current behavior

Homepage cards go through `CatalogPublicItemCardGrid` → `CatalogPublicItemCard`.

| Request | Today |
|---------|--------|
| Mobile gap | Nearby and search grids already pass `gap-2 md:gap-3` |
| Company line | Company block uses `border-t border-border` |
| Tags | `flex-wrap`, first 3 chips, then `+N` |
| References | `t('refs')` next to the item name |

`CatalogPublicItemCard` is only used by the public website home nearby grid and search results.

## Approach

Keep the existing homepage gap classes. Change only the card body: drop the divider, drop the refs label, and make the tag row a single horizontal scroller below `md`.

## Implementation steps

1. **Company row** — In `CatalogPublicItemCard.tsx`, remove `border-t border-border` from the company wrapper. Keep `mt-auto pt-2`.
2. **References** — Remove the refs span and the `refs` translation from the card. Leave locale keys in place (unused strings are harmless).
3. **Tags** — Render every tag in `flex flex-nowrap overflow-x-auto` with `shrink-0` chips. From `md`, hide chips after the third and show `+N`, with wrap as today. Stop click propagation on the tag row so a swipe does not open the detail page.
4. **Gap** — Leave `NearbyHomeSection` (`grid-cols-2 gap-2 py-0 sm:grid-cols-2 md:gap-3`) and `CatalogSearchResults` (`gap-2 py-0 md:gap-3`) as they are.
5. **Verify** — `npm run type-check -w website-root` and `npm run lint -w @webonone/website-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Desktop tag truncation stays at three chips. Only viewports below `md` swipe through the full list.
- Support docs are not required for this visual change.
