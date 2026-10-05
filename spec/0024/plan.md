# Plan — Feedback 0024

## Approach

Identity already clears stale session and skips auto-complete when `prompt=login` is present (`usePromptLoginSessionClear`, `LoginPage` `freshLoginAllowedRef`). Support must pass that flag on every standalone OAuth redirect to Identity. Minimal change: set `prompt: 'login'` in `buildIdentityLoginUrl` `extraSearchParams`. Optionally mirror `prompt=login` on local Support `/login` navigations for consistency (LoginPage still redirects immediately).

## Implementation steps

1. **`support/frontend/src/features/auth/utils/buildIdentityLoginUrl.ts`**
   - Add `prompt: 'login'` to `extraSearchParams` alongside theme/locale relay params so Identity URL always forces interactive login.

2. **`support/frontend/src/features/auth/components/PrivateRoute.tsx`** (optional consistency)
   - Navigate to `/login?prompt=login&return=…` instead of `/login?return=…`.

3. **`support/frontend/src/features/docs/components/SupportHeader.tsx`** (optional consistency)
   - Sign In button → `/login?prompt=login&return=…`.

4. **Help articles** — not needed (bug fix; login already expected for Bug & Feature).

5. **Verify** — type-check + lint on Support workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Support will no longer silent-SSO from an active Identity session when opening Bug & Feature — intentional per reporter.
- Platform handoff (`code` + `return_url` / embed) is unchanged; `PrivateRoute` still allows `hasAnyPlatformHandoff` without forcing login.
