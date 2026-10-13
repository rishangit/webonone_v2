# Plan — Feedback 0039

## Current behavior

`AppLayout` renders `AppShell` with `<BrandLogo mark />` and no `logoHref`. `BrandLogo` without `href` is a non-interactive wordmark.

`AppHeader` already accepts `menuItems` (rendered after the profile block separator, before Profile and Log out). `AppShell` does not forward that prop, so the WebOnOne shell cannot add a row.

Website return already exists: `redirectToWebsiteWithAuthCode(accessToken, getWebsiteHomepageUrl())` in `webonone-v2/frontend/src/features/auth/utils/redirectToWebsite.ts`.

Help: `support/frontend/src/content/{en,si}/app-preferences/notifications.md` describes the avatar menu as profile and log out only.

## Approach

Thread an optional menu slot through `AppShell`. In WebOnOne, one handler opens the public homepage with the auth-code handoff. Use it for a `DropdownMenuItem` and for a button wrapping the logo. Update the existing header help article.

## Implementation steps

1. **UI Kit** — Add `headerMenuItems?: ReactNode` on `AppShell` and pass it to `AppHeader` as `menuItems` (chrome + shell).
2. **Copy** — `shell.header.homepage` and `shell.header.homepageFailed` in `webonone-v2/frontend/src/locales/en/shell.json` and `si/shell.json`.
3. **Shell** — In `AppLayout`, `handleOpenHomepage` calls `redirectToWebsiteWithAuthCode` when `accessToken` is set; on failure, `toast` destructive with `homepageFailed`. Pass `headerMenuItems` (`House` icon + Homepage label). Wrap `BrandLogo` in a `type="button"` control with `aria-label` from `shell.header.homepage`.
4. **Help** — Add a bullet to the English and Sinhala notifications articles: logo and **Homepage** open the public WebOnOne homepage in the same tab.
5. **Verify** — type-check and lint for `ui-kit-root`, `@webonone/ui-kit`, `webonone-v2-root`, `@webonone/webonone-frontend`, and `support-root`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Auth-code mint needs Identity. Failure stays on the current app page and shows a toast.
- The logo control is same-tab only (no raw website `href`), so the session is not dropped on a direct navigation.
