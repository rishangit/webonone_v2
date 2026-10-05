# Plan — Feedback 0023

## Approach

Mirror Media/Email satellite logout: clear Support auth storage synchronously, then `performPlatformLogout` through Identity. Use `postLogoutRedirectUri` set to Support public home (`{origin}/`) so Identity does not send the user to Support `/login` (auto-redirect to Identity looks like “relogin”). Identity may append `prompt=login` to the home URL; Support ignores that query today — guest UI still shows.

## Implementation steps

1. **`support/frontend/src/features/docs/components/SupportHeader.tsx`**
   - Import `performPlatformLogout` from `@webonone/platform-nav`.
   - Import `clearSupportAuthStorage` from `@/features/auth/store/authSlice` (keep or drop `authActions` if unused).
   - Import `getIdentityOrigin` from `@/features/auth/utils/identityConfig`.
   - Replace `handleLogout`:
     ```tsx
     const handleLogout = useCallback(() => {
       clearSupportAuthStorage()
       performPlatformLogout(null, {
         identityOrigin: getIdentityOrigin(),
         postLogoutRedirectUri: `${window.location.origin}/`,
       })
     }, [])
     ```
   - Do **not** `dispatch(authActions.logout())` before redirect (avoids flash; storage clear + full navigation is enough).
   - Remove unused `dispatch` / `useAppDispatch` if no longer needed.

2. **Help articles** — not needed (bug fix; Sign out already documented implicitly).

3. **Verify** — type-check + lint on Support workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- If Identity rejects Support origin as `post_logout_redirect_uri`, user falls back to Identity login; Support storage is still cleared. Staging/prod allowlist includes `https://*.webonone.com`.
- Do not redirect post-logout to Support `/login` — that page auto-assigns to Identity login.
