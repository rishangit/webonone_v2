# Plan — Feedback 0038

## Current behavior

`CatalogDetailPage` sits inside `WebsiteLayout`, whose root uses `shellChromeRootClassName` (`gap-2 p-2`).

| Region | Today |
|--------|--------|
| Location bar wrapper | `px-4 pt-2 sm:px-8` |
| Scroll body wrapper | `px-4 pb-12 sm:px-8` |
| `FeaturePage` | `websitePageContentClassName` plus `px-0` (overrides kit `shellPagePadding` horizontal inset) |
| Home page | No extra `px-4`; column is `websitePageContentClassName` only |
| Expo product screens | `FeatureScreen` content inset `px-2 py-4` |

The extra `px-4` is what makes the phone detail page narrower than home and the app.

## Approach

Drop horizontal padding below `sm` on the two detail wrappers. Keep `sm:px-8`. Record the rule in a new skill and index it from `AGENTS.md`.

## Implementation steps

1. **Gutters** — In `CatalogDetailPage.tsx`, change both wrappers from `px-4 … sm:px-8` to `px-0 … sm:px-8`. Leave vertical padding (`pt-2`, `pb-12`) and `FeaturePage` classes as they are.
2. **Skill** — Add `.cursor/skills/web-mobile-view/SKILL.md`: phone width is below `sm`; public item details use maximum `#main-content` width (shell `p-2` only); do not stack another `px-4`; compare with `FeatureScreen` `px-2`. Name the catalog detail page as the reference.
3. **Index** — Add the skill to the cross-cutting skills table in `AGENTS.md`.
4. **Verify** — `npm run type-check -w website-root` and `npm run lint -w @webonone/website-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `sm:px-8` still applies from 640px up, including large phones in landscape if they cross `sm`.
- Support docs are not required for this visual change.
