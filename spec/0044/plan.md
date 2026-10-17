# Plan 0044 — Promote Forms and Website in the left nav

## Approach

`DESIGN_PLATFORM_NAV_GROUP` and `DESIGN_SUPER_ADMIN_NAV_GROUP` in `packages/platform-nav/src/coreNav.ts` become leaf items that reuse the existing sentinels (`/design/forms`, `/design/website`), `externalService: 'design'`, and external paths (`/forms`, `/website`). Main and member nav get both leaves in the slot where the Design group sits (after Payment, before Companies). Super-admin nav gets Website only, in the slot where the Design group sits today (after Data, before Email).

`COMPANY_SESSION_ONLY_GROUPS` drops `Design`. `withoutCompanySessionOnlyGroups` also drops top-level items whose labels are `Forms` or `Website`, so a default user (member, no company) still loses those rows.

WebOnOne `navItems.ts` and mobile `navIcons.ts` map Forms to `FileText` and Website to `Globe`, and drop the unused Design group icon. Mobile `peerDestinations` titles the forms webview **Forms**.

Support articles (`en` and `si`) replace **Design → Forms** / **Design → Website** click paths with the top-level labels, and update left-navigation, log-into-company, and mobile-app menu lists.

## Files

- `packages/platform-nav/src/coreNav.ts`
- `packages/platform-nav/src/coreNav.test.ts`
- `packages/platform-nav/src/sessionRoleNav.ts`
- `packages/platform-nav/src/sessionRoleNav.test.ts`
- `webonone-v2/frontend/src/features/shell/config/navItems.ts`
- `mobile/src/features/shell/navIcons.ts`
- `mobile/src/features/peer/peerDestinations.ts`
- `support/frontend/src/content/{en,si}/**` articles that name the Design menu path

## Verification

Commands in `spec/0044/spec.md`.
