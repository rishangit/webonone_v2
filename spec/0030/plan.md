# Plan — Feedback 0030

## Root cause

0029 put **SMS Credits** on SMS FE `DashboardPage` at `/`. Standalone SMS nav includes Dashboard; WebOnOne `SMS_PLATFORM_NAV_GROUP` does not. Shell default peer path falls back to `/send`. Admins never open the page that hosts the card.

## Approach

Add a first-class **Dashboard** SMS nav sentinel and wire it through platform-nav → WebOnOne shell → SMS iframe `/`.

## Implementation steps

1. **`packages/platform-nav`**
   - Add `SMS_NAV_SENTINELS.dashboard = '/sms/dashboard'`.
   - Map `smsSentinelToExternalPath` → `'/'`.
   - Include in `isSmsNavSentinel`.
   - Insert Dashboard as **first** child of `SMS_PLATFORM_NAV_GROUP` (`externalPath: '/'`).
   - Extend `coreNav.test.ts` (and any related tests).

2. **`webonone-v2/frontend`**
   - Map `SMS_NAV_SENTINELS.dashboard` → `LayoutDashboard` in `navItems.ts`.
   - Add `dashboard` to `isAllowedSmsShellNavigatePath` top-level set in `PlatformPeerFrame.tsx`.

3. **`mobile/`**
   - Map dashboard sentinel icon in `navIcons.ts` (same nav defs from platform-nav).

4. **`support/`**
   - Confirm overview already documents SMS → Dashboard; minor clarity only if nav order wording is wrong.

5. **Verify** — platform-nav tests + type-check touched workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Changing `packages/platform-nav` fans out deploy consumers per `deploy-services.json` (expected selective multi-service).
- Do not use bare `/sms` as sentinel — AppLayout peer detection uses `pathname.startsWith('/sms/')`.
