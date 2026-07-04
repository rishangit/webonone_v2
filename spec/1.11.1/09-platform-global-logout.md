# 09 — Platform global logout (delta)

## Problem

After 1.11.1 SSO (Phase 7), signing out from one microservice only clears **that origin's** `sessionStorage`. The **Identity session** (refresh tokens + Identity FE storage) remains valid, so opening another service or `/login` silently re-authenticates via auth-code redirect — the user appears still signed in.

Subtask: **when user sing out from the any service need to sing out from the all other misroservices** (86ey5pd32).

## Root cause

| Area | Issue |
|------|-------|
| WebOnOne logout | Clears local JWT only; navigates to `/login` — Identity session untouched |
| Satellite logout | `performPlatformLogout` redirects to core `/login` without clearing Identity |
| Identity | `POST /auth/logout` revokes **one** refresh token; no global logout endpoint or `/logout` page |
| SSO | Auth-code exchange succeeds while Identity refresh tokens remain |

## Target behaviour

| Scenario | Expected |
|----------|----------|
| User signs out from Data (platform shell) | Identity session cleared; WebOnOne and other services cannot SSO until re-login |
| User signs out from WebOnOne | Same — Identity global logout, land on `/login?prompt=login` |
| User signs out from Identity profile | Clears Identity session; redirect to core or Identity login with `prompt=login` |
| Re-open any service after logout | Login form shown — no silent SSO |

## Implementation

### 1. Identity backend — revoke all sessions

| Item | Change |
|------|--------|
| Repository | `revokeAllRefreshTokensForUser(userId)` |
| Service | `logoutAllUserSessions(userId)` |
| Route | `POST /api/v1/auth/logout-all` (requires bearer access token) |

### 2. Identity frontend — `/logout` page

| Item | Change |
|------|--------|
| Route | `GET /logout?post_logout_redirect_uri=<allowlisted URL>` |
| Page | Call `logout-all`, `persistAuthSession(null)`, redirect to `post_logout_redirect_uri` (append `prompt=login` if missing) |
| Fallback | No param → `/login?prompt=login` |

Validate `post_logout_redirect_uri` origin against consumer allowlist (same patterns as `return_url`).

### 3. `@webonone/platform-nav` — logout via Identity

| Item | Change |
|------|--------|
| `buildIdentityLogoutUrl(identityOrigin, postLogoutRedirectUri)` | New helper |
| `performPlatformLogout(returnUrl, { identityOrigin, localLoginPath })` | Clear local storage at call site; redirect through Identity `/logout` when `identityOrigin` provided |
| Post-logout target | Absolute URL to service or core `/login?prompt=login` |

### 4. Consumer frontends

| Service | Change |
|---------|--------|
| WebOnOne | `handleLogout` — clear storage, `performPlatformLogout(null, { identityOrigin })` |
| Data, Email | Pass `identityOrigin` into `performPlatformLogout` |
| Media | Same pattern |
| Identity `AppLayout` | Redirect self through `/logout?post_logout_redirect_uri=...` instead of only clearing storage |

## Security

- `post_logout_redirect_uri` must match allowlisted origins (no open redirect).
- `logout-all` requires valid bearer token — cannot revoke another user's sessions.
- Access tokens remain valid until `exp` (short acceptable window); refresh tokens revoked prevent renewal and SSO re-issue.

## Acceptance

- Sign out from Data → open WebOnOne → must show login (no silent SSO)
- Sign out from WebOnOne → open Data → must show login
- Sign out from Identity profile with `return_url` → core login, no auto SSO
- `npm run type-check` passes on identity-root, webonone-v2-root, data-root, email-root, media-root
- `npm run build:platform-nav` succeeds

## ClickUp

Subtask **when user sing out from the any service need to sing out from the all other misroservices** (86ey5pd32).
