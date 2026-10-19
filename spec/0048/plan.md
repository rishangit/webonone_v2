# Plan 0048 — Pending company list card only

## UI reuse

Similar UI already on the Super Admin Dashboard from ticket 0047:

- Web: `HomePage` `Card variant="list"` + `PendingCompaniesList` (`ItemList`, `ImagePreview`, `StatusTag`).
- Mobile: `DashboardScreen` `Card` + `PendingCompaniesList`.
- Scroll: existing `scrollbar-themed` on web overflow regions (for example `OptionSelectionDialog`).

Reuse those list components. Do not add a new card primitive. Remove the Super Admin `StatCard` row and `SmsCreditsFrame` from the home page only. `StatCard` stays for Analytics (web) and the SMS dashboard (mobile).

## Web (`webonone-v2/frontend`)

1. `HomePage`: when `activeRole === 'super_admin'`, render a single full-width pending-company `Card`. Drop the three status `StatCard`s and `SmsCreditsFrame` from that branch. Keep SMS Credits for `company_admin` only (`canViewSmsCredits`).
2. `PendingCompaniesList`: when `items.length > 3`, wrap the list in `max-h-[16.5rem] overflow-y-auto scrollbar-themed` (three rows: list `py-4`, row `p-2` + `h-14` thumb, `gap-2`). Fewer than three items use natural height.
3. Remove unused `selectCompanyStatusCounts` usage. Drop the selector and `statusPending` / `statusApproved` / `statusRejected` home locale keys if nothing else imports them.

## Mobile

1. `DashboardScreen`: Super Admin branch is only the pending `Card`. Remove status `StatCard`s and the local count math.
2. `PendingCompaniesList`: when there are more than three items, wrap the list in a `ScrollView` with `nestedScrollEnabled` and `max-h-[16.5rem]`. Shorter lists stay unsized.

## Support

- `support/frontend/src/content/{en,si}/app-preferences/dashboard.md` — Super Admin sees the pending list (about three visible, scroll inside the card). SMS Credits on the home Dashboard is for company owners.
- `support/frontend/src/content/{en,si}/communications/sms-overview.md` — home Dashboard SMS Credits is company owners; Super Admins still see it on SMS → Dashboard.

## Verification

```bash
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run lint -w @webonone/mobile
npm run type-check -w support-root
```
