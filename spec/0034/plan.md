# Plan — Feedback 0034

## Current behavior

`WebsiteHomePage` renders `CurrentLocationBar`, then brand, headline, and subtitle, then a search form that navigates to `/search?q=`. `searchPublicCatalog` returns an empty page when `q` is blank. Sellable kinds are products, services, and spaces on approved companies; distance uses company latitude/longitude.

## Approach

Add a nearby read that does not change text search. With `lat` and `lng`, load approved companies that have coordinates, sort by distance, keep the nearest companies that have at least one sellable item, and attach those items. The website BFF proxies the call. Home drops the hero copy, keeps search at the top (under the location bar), and renders company cards with item cards beneath them.

## Implementation steps

1. **WebOnOne repository** — `listApprovedCompaniesWithCoordinates` and `listApprovedCatalogByCompanyIds` (same sellable rules as search: linked, or forked/custom and verified).

2. **WebOnOne service + route** — `listNearbyPublicCatalog({ lat, lng, companyLimit })`. Skip companies with no hydrated items. Cap at 8 companies and 12 items per company. Register `GET /internal/catalog/nearby` **before** `/internal/catalog/:kind/:id`. Return 400 when lat/lng are missing or invalid.

3. **Website BFF** — `GET /catalog/nearby` before `/catalog/:kind/:id`, proxying query `lat`, `lng`.

4. **Website home** — Remove brand, headline, and subtitle. Search form at the top of the content column. When coords are ready, load nearby and render company `Card`s (logo via `ImagePreview`, name, distance) and a grid of item cards linking to `/catalog/:kind/:id`. Loading uses `Spinner`. No coords after location settles: short copy, no global list. Empty nearby: short empty copy.

5. **i18n** — `home` namespace en + si for section labels, kinds, distance, loading, empty, and location-needed copy. Leave unused hero keys in place so other references do not break; home simply stops rendering them.

6. **Support** — `en` and `si` `public-catalog/browse-search.md`: home shows search at the top and nearby company, product, service, and space cards.

7. **Verify** — type-check/lint workspaces in the spec.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Nearby results follow approximate IP location until the visitor allows GPS. Order updates when precise coords arrive.
- Companies without a map pin are omitted from this list.
- Text search behavior is unchanged.
