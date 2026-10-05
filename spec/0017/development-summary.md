# Development summary — Feedback 0017

| Field | Value |
|-------|-------|
| Ticket | `0017` |
| Feedback id | `bbSkAeT7448uXu9468VmW` |
| Title | Add User dialog window mobile UI improvements |
| Type | `feature` |
| Completed | 2026-10-05 |

## What was delivered

Selection dialogs that combine a searchable list with Add now use the same compact `ListPageActions` + `SearchInput` + `ListAddButton` toolbar as mobile list pages. Web covers Add User / POS Select customer (`UserSelectionDialog`), Data tag/unit/attribute pickers, and company library pickers. Native covers POS customer picker and Add User (picker is the primary surface with toolbar Add → register).

## Where to see it

| Surface | How |
|---------|-----|
| Staging web | Identity → Users → Add; Sales → POS → select customer; Data tag/unit/attribute pickers; company library pickers — resize below 640px |
| Staging Support | `/docs/people/company-users`, `/docs/sales-billing/pos` |
| Local web | `npm run dev:identity` / `npm run dev:webonone` / `npm run dev:data` |
| Local native | `npm run mobile` — Users → Add; Sales → POS → customer |

## Feature details

- Below `sm` (web) and on native, search starts as an icon and Add as `+` until expanded — same motion as list pages.
- Desktop web keeps full search field + labeled Add.
- Native Add User opens the user list picker directly; Add opens register form.
- Native POS customer picker footer is Cancel only; Add lives in the toolbar.
- Role filter on web user picker remains in the toolbar when configured.

## Code and docs touched

| Area | Paths |
|------|-------|
| `ui-kit/` | `package/src/components/UserSelectionDialog.tsx` |
| `data/` | `TagPickerPanel`, `UnitPickerPanel`, `AttributePickerPanel` |
| `webonone-v2/` | `LibraryPickerPanel.tsx` |
| `packages/mobile-ui/` | `UserSelectionDialog.tsx` |
| `mobile/` | `CustomerPickerDialog.tsx`, `AddCompanyUserDialog.tsx` |
| `support/` | `en` + `si` `company-users`, `pos` |
| `spec/0017/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w data-root
npm run lint -w @webonone/data-frontend
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

## Deploy

| Item | Value |
|------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0017: mobile list toolbar for picker dialogs` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
