# Plan 0050 — Company Draft, then owner request, then super-admin approve

## UI reuse

Reuse report (ui-consistency): keep existing company `StatusTag` chips and row menus. Do not add a status-menu component or a wizard approval step.

| Need | Reuse |
|------|--------|
| Draft chip | `StatusTag` in `@webonone/ui-kit` and `@webonone/mobile-ui` — add variant `draft` (muted label “Draft”) |
| Owner request | Web `DropdownMenuItem` in `MyCompaniesList` and `Button` `size="sm"` in `CompanyProfilePage` `FeaturePage` actions, beside Copy to AI |
| Mobile request | `ItemListMenuItem` in mobile `MyCompaniesList` and `Button` in `CompanyDetailScreen` `FeatureScreen` actions |
| Super-admin approve | Existing Approve item in web `CompaniesList` and mobile `AdminCompaniesList`; disable when status is `draft` or `approved` |
| Feedback | `useToast` for the owner request mutation |

## Backend (`webonone-v2`)

1. Migration: extend `companies.status` enum with `draft` and default **new** rows to `draft`. Do not rewrite existing rows. Down-migration maps `draft` → `pending` before shrinking the enum.
2. `registerCompany` inserts `draft`. Skip `notifyCompanyPendingReview` and `company_registered` email.
3. `POST /company/:id/request-approval` (authenticated owner only): draft → pending, then send the registration email and pending-review notification. 404 if not owner. 409 if not draft. Do not demote the owner role.
4. `approveCompany` and `updateCompanyStatus` to `approved` reject when the current status is `draft` (409). Pending and rejected may still be approved.
5. `isSelectableCompanyStatus` includes `draft` so Choose account still lists the company during setup.
6. AI: `register_company` description says Draft; new `request_company_approval` tool (`ai:company:register`, role `company_admin`); `approve_company` description says pending (not draft).

## Web and kits

1. `CompanyStatus` unions include `draft` (admin list, my companies, dashboard, analytics progress).
2. Store epic `requestCompanyApprovalRequested` → API → update my-companies row and open detail.
3. Locale `en` / `si`: request-approval labels; registration success says the company is Draft until the owner requests approval.
4. Showcase tag pages list the Draft chip next to Pending.

## Mobile

Mirror the web owner menu, profile header button, and admin Approve disable. Types in `companyApi` and dashboard/analytics include `draft`.

## Support

Update `support/frontend/src/content/{en,si}/companies/register-company.md`, `pending-approval.md`, and `approve-companies.md`.

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w ui-kit-root
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
