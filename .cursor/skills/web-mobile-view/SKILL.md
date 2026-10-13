---
name: web-mobile-view
description: >-
  Aligns phone-width web UI with the Expo app product mobile view, using the
  maximum content width below sm. Use when editing website or web item details,
  mobile gutters, px-4 page padding, FeaturePage width on small screens, or
  any web layout that should match FeatureScreen.
---

# Web mobile view

Phone-width web pages (below Tailwind `sm`, 640px) should use the **maximum content width** and line up with the Expo app product screens.

## Width

| Surface | Horizontal inset on a phone |
|---------|-----------------------------|
| Website shell | `shellChromeRootClassName` = `p-2` on `.app-shell-root` |
| Public catalog item details | **No extra** page gutter below `sm` (`px-0`). From `sm` up, `sm:px-8`. |
| Expo product screens | `FeatureScreen` content `px-2 py-4` (`packages/mobile-ui/src/components/FeatureScreen.tsx`) |

The shell `p-2` is the phone inset. Do not stack another `px-4` (or `px-8`) on the item details location bar or scroll body. That extra gutter is what makes the detail column narrower than the home page and the app.

Reference: `website/frontend/src/features/website/pages/CatalogDetailPage.tsx`.

```tsx
<div className="relative z-10 shrink-0 bg-background px-0 pt-2 sm:px-8">
  {/* location bar */}
</div>
<div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-0 pb-12 sm:px-8">
  <FeaturePage className={`${websitePageContentClassName} px-0 py-4 sm:px-0 sm:pb-0 sm:pt-4`} />
</div>
```

`websitePageContentClassName` (`max-w-[100rem]`) stays. It caps large screens; it does not shrink phones.

## When aligning other web mobile UI

1. Open the matching Expo screen (`FeatureScreen` or the feature screen under `mobile/src/features/`).
2. On viewports below `sm`, drop page-level horizontal padding so content fills `#main-content`.
3. Keep `sm:` / `md:` gutters that already exist for tablet and desktop.
4. Do not change homepage card grids, kit `shellPagePadding`, or `FeatureScreen` `px-2` as part of a website detail-width fix.

## Out of scope

- Dialog shells (`CustomDialog` is already `w-full` below `sm`)
- Native-only screens that have no web counterpart
- Adding a second max-width column inside the phone detail page
