# Plan 0045 — Website sections as left-nav items

## Approach

Replace `WEBSITE_NAV_ITEM` in `packages/platform-nav/src/coreNav.ts` with a `Website` group. Company and member nav children: Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, Media, Settings, each a design sentinel (`/design/website/<section>`) with `externalPath` `/website/<section>`. Super-admin nav uses the same group without Data Sets, Media, and Settings.

`COMPANY_SESSION_ONLY_GROUPS` gains `Website` and `COMPANY_SESSION_ONLY_ITEMS` drops `Website`, so a default user still loses the group. Existing `isDesignNavSentinel` / `designSentinelToExternalPath` already accept `/design/website/...`.

`NAV_LABEL_KEYS` plus `en`/`si` `common.json` translate Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, and Media. Settings already maps.

WebOnOne and mobile icon maps give the group `Globe` and a distinct icon per child. Identity, Email, and Data core-nav maps do the same by pathname suffix (`/website/pages`, …). Design standalone `navItems.ts` builds the same group, filtered by role.

`WebsiteHubTabs` stops rendering the tab list and only wraps list actions. Call sites that rendered tabs with no actions drop the component. Mobile deletes `WebsiteHubTabs`; the media upload button moves into `FeatureScreen` actions. List pages stay as they are.

Support articles (`en` and `si`) replace “open Website and choose the tab” with **Website → {section}**.

## Files

- `packages/platform-nav/src/coreNav.ts`
- `packages/platform-nav/src/coreNav.test.ts`
- `packages/platform-nav/src/sessionRoleNav.ts`
- `packages/platform-nav/src/sessionRoleNav.test.ts`
- `packages/i18n/src/translateNavItems.ts`
- `packages/i18n/src/locales/{en,si}/common.json`
- `webonone-v2/frontend/src/features/shell/config/navItems.ts`
- `design/frontend/src/features/shell/config/navItems.ts`
- `design/frontend/src/features/website/components/WebsiteHubTabs.tsx`
- `design/frontend/src/features/website/components/WebsiteHubListPage.tsx`
- `design/frontend/src/features/website/pages/*` that mount hub tabs
- `identity/frontend/src/features/shell/config/navItems.ts`
- `email/frontend/src/features/shell/config/coreNavItems.ts`
- `data/frontend/src/features/shell/config/coreNavItems.ts`
- `mobile/src/features/shell/navIcons.ts`
- `mobile/src/features/design/website/**` hub tab usages
- `support/frontend/src/content/{en,si}/website-forms/*.md` and left-navigation copy that names Website tabs

## Verification

Commands in `spec/0045/spec.md`.
