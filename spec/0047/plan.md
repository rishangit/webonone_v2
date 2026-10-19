# Plan 0047 — Super admin dashboard pending companies

## Approach

Reuse `GET /api/v1/company/admin/companies` (already Super Admin only). Derive status counts and the pending subset on the client. No backend or migration change.

The home feature must not import settings feature modules. Add a thin home API client that calls the same path.

## UI reuse

- Status cards: same `Card` + muted title + large count as `AnalyticsStatCard`. Move that card to `webonone-v2/frontend/src/shared/components/StatCard.tsx` and point Analytics at it, then use it on the Dashboard.
- Pending rows: `@webonone/ui-kit` `ItemList` / `ItemListItem` / `ItemListEmpty` / `StatusTag` / `ImagePreview` (same row shape as `CompaniesList`, without status menus).
- Mobile: `@webonone/mobile-ui` `Card`, `ItemList`, `StatusTag`, `ImagePreview`. Lift the local SMS `StatCard` into `mobile/src/shared/components/StatCard.tsx` and use it on both SMS and home dashboards.
- Loading: web `usePlatformLoading`; mobile `Spinner`.
- Dates: `formatLocaleDateTime` / mobile display helper (`Oct 10, 2026, …`).

## Web (`webonone-v2/frontend`)

1. `features/home/services/adminCompaniesApi.ts` — `listAllCompanies()`.
2. Extend `homeDashboard` slice + epic:
   - `loadCompaniesRequested` / succeeded / failed
   - Cache with `isFresh` (5 min), clear on logout/login
   - `exhaustMap` (mount load)
   - State: `companies`, `companiesLastFetchedAt`, `companiesError`
3. Selectors: counts by status; pending sorted by `createdAt` desc.
4. `HomePage`: when `activeRole === 'super_admin'`, render three `StatCard`s and `PendingCompaniesList`. Row navigates to `/companies/:id`. Keep `SmsCreditsFrame`. Do not load calendar events for Super Admin (unchanged: `canBrowseCalendar` excludes that role).
5. `locales/en/home.json` and `locales/si/home.json` keys for card titles, list title, empty copy.

## Mobile

1. `features/home/services/adminCompaniesApi.ts` — same GET.
2. `DashboardScreen`: when `user.role === 'super_admin'`, load companies in the existing screen fetch pattern, show `StatCard`s and an `ItemList` of pending companies. Row pushes `/companies/:companyId`.
3. `mobile/src/locales/{en,si}/home.json` matching keys.

## Support

Update `support/frontend/src/content/{en,si}/app-preferences/dashboard.md` so Super Admin copy includes status cards and the pending list, with a link to approve-companies.

## Verification

Commands in `spec.md`. Manual: Super Admin home shows counts matching All Companies; pending rows open the company profile; a company admin home still shows events.
