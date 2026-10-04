# Development summary — Feedback 0015

| Field | Value |
|-------|-------|
| Ticket | `0015` |
| Feedback id | `3NDCmcNYgHoQxDXcedAic` |
| Title | Add media dialog window improvement for mobile UI |
| Type | `bug` |
| Completed | `2026-10-04` |

## What was delivered

The Add Media / Media Library folder toolbar now uses list-page mobile search (`ListPageActions` + compact `SearchInput` with clear) and aligns Upload, Create folder, List, and Thumbnail controls to `h-9 w-9` full-circle icon buttons matching `ListFilterTrigger`. Filename/folder filtering is unchanged. Cursor rules were updated so this Media toolbar is allowed to use compact search.

## Where to see it

| Surface | How |
|---------|-----|
| Staging | Open a company → gallery / media Add images (Select media dialog) on a phone-width viewport, or Media Library with icon toolbar |
| Local | `npm run dev:media` + consumer that opens `/selector` (e.g. WebOnOne gallery Add) at ~375px width |
| Support docs | None (toolbar layout not documented in help) |

## Feature details

- Below `sm`: search is a circular icon; tap expands left like Tags/list pages; clear resets the query.
- Filter, Upload, FolderPlus, List, and LayoutGrid share `h-9 w-9` circular geometry under pill radius.
- `sm+`: full `w-64` search field beside the other controls; breadcrumb left / toolbar right unchanged.
- Non-icon-toolbar browser row also uses `ListPageActions` for the same compact search.

## Code and docs touched

| Area | Paths |
|------|-------|
| Media FE | `media/frontend/src/features/media/components/ScopedFolderBrowser.tsx` |
| Rules | `.cursor/rules/list-filter-panel.mdc`, `.cursor/rules/ui-kit-consumption.mdc` |
| Spec | `spec/0015/spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/media-frontend
npm run lint -w @webonone/media-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0015: Add media dialog mobile toolbar` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
