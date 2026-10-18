# Plan 0046 — Hide the unrelated create-form button

## Approach

On Pages, Layouts, Headers, Footers, and Presets, pass the create-form `addLabel` / `onAdd` only when `user.role === 'super_admin'`. Company admins keep `WebsiteLibraryCopyControl` (`Add from library`) and the existing row Duplicate action. Themes, Data Sets, Media, and Settings keep their current add buttons.

Mobile screens for the same five sections render `ListAddButton` only for `super_admin`. Read the role from `useSession()`.

Update Support articles (`en` and `si`) so company admins are told to use **Add from library** or **Duplicate**, and Super Admin is told the create-form button remains on those lists.

## Files

- `design/frontend/src/features/website/pages/WebsitePagesPage.tsx`
- `design/frontend/src/features/website/pages/WebsiteLayoutsPage.tsx`
- `design/frontend/src/features/website/pages/WebsiteChromePage.tsx`
- `design/frontend/src/features/website/pages/WebsitePresetsPage.tsx`
- `mobile/src/features/design/website/screens/WebsitePagesScreen.tsx`
- `mobile/src/features/design/website/screens/WebsiteLayoutsScreen.tsx`
- `mobile/src/features/design/website/screens/WebsiteChromeScreen.tsx`
- `mobile/src/features/design/website/screens/WebsitePresetsScreen.tsx`
- `support/frontend/src/content/{en,si}/website-forms/website-pages.md`
- `support/frontend/src/content/{en,si}/website-forms/website-layouts.md`
- `support/frontend/src/content/{en,si}/website-forms/headers-footers.md`
- `support/frontend/src/content/{en,si}/website-forms/website-presets.md`

## Verification

Commands in `spec/0046/spec.md`.
