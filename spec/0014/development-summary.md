# Development summary — Feedback 0014

| Field | Value |
|-------|-------|
| Ticket | `0014` |
| Feedback id | `zi7bZZl7eaaA43NCi5HOY` |
| Title | Improvements to the add button on the mobile view list page |
| Type | `feature` |
| Completed | `2026-10-04` |

## What was delivered

Compact `ListAddButton` on mobile list toolbars now starts as a rounded primary **+** icon only (no “Add” text). First tap expands left to the full children label; second tap runs the create action. Same behavior in `@webonone/ui-kit` (web below `sm`) and `@webonone/mobile-ui` (native). Primary gradient background unchanged. Agent docs and showcase copy updated from “+ Add” to icon-only.

## Where to see it

| Surface | How |
|---------|-----|
| Staging web (narrow) | Any list with `ListAddButton` (e.g. Data Tags, Design website pages) — viewport &lt; `sm` → **+** only → tap expands → tap again opens create |
| Staging native | Expo / mobile app list screens (Tags, catalog, staff, etc.) — same expand-then-act |
| UI Kit showcase | `npm run dev:ui-kit` → Components → List filters / Pages → List page |
| Local web | `npm run dev:data` (or any list service) + narrow browser |
| Local native | `npm run mobile` → a catalog/list screen with Add |
| Support docs | none (no article described compact Add) |

## Feature details

- Collapsed: Plus icon only, square rounded primary control (~`h-9 w-9` web / `h-11 w-11` native).
- Expanded: Plus + full label; 300ms ease-out width animation; search open / outside tap still collapses.
- Desktop web (`sm+`): unchanged Plus + full label, no expand step.
- `compactLabel` prop retained for call-site compat; ignored for collapsed display.

## Code and docs touched

| Root | Paths |
|------|-------|
| `ui-kit/package` | `src/components/ListAddButton.tsx` |
| `ui-kit/showcase` | `src/pages/ComponentsPage.tsx` |
| `packages/mobile-ui` | `src/components/ListAddButton.tsx` |
| `.cursor/rules` | `feature-page-layout.mdc`, `list-filter-panel.mdc` |
| `.cursor/skills` | `item-list/SKILL.md`, `ui-kit-agent/SKILL.md` |
| `spec/0014/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0014: icon-only mobile list Add button` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

Set to **`staging`** after successful push (`closed` remains super admin).
