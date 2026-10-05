# Development summary — Feedback 0022

| Field | Value |
|-------|-------|
| Ticket | `0022` |
| Feedback id | `zgseKdhZ5IXLGsRrCVrs6` |
| Title | Add product from library dialog mobile UI should align with mobile view |
| Type | `bug` |
| Completed | 2026-10-05 |

## What was delivered

Native Add-from-library dialog toolbar now matches mobile list pages: `ListPageActions` wraps compact `SearchInput` and `ListAddButton` (“Add product to library” via i18n). Search starts as an icon and Add as `+` until expanded — same as Tags / company catalog lists. Applies to all `LibraryPickerPanel` kinds that can create in library (products, services, spaces).

## Where to see it

| Surface | How |
|---------|-----|
| Local native | `npm run mobile` — Data → Products → Add → Add from library |
| Staging web | N/A (web library picker already used list toolbar; this fix is Expo) |
| Support docs | Not updated (layout parity only) |

## Feature details

- Toolbar order: search first, then Add (required for list-page overlay geometry).
- Create-in-library still opens `LibraryItemCreateHost`; disabled while create is open.
- No change to pick/save API or web `LibraryPickerPanel`.

## Code and docs touched

| Area | Paths |
|------|-------|
| `mobile/` | `src/features/data/company-catalog/components/LibraryPickerPanel.tsx` |
| `spec/0022/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/mobile
npm run type-check -w @webonone/mobile-ui
```

## Deploy

| Item | Value |
|------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0022: align library picker with mobile list toolbar` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
