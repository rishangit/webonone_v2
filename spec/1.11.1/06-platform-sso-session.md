# 06 — Platform SSO and longer session (delta)

## Problem

Users must sign in separately per service (Data, WebOnOne, Email, Media) even after authenticating with Identity. Sessions expire too quickly for a work day.

## Subtask requirements (ClickUp 86ey5nqjw)

1. **Increase session time** — longer-lived login sessions across the platform.
2. **Single sign-on (SSO)** — sign in once; other services authenticate without showing the login form again when Identity already has a session.

## Root cause

Consumer `buildIdentityLoginUrl` helpers pass **`prompt=login`** to Identity. Identity clears any stored session when that query param is present (`usePromptLoginSessionClear`), forcing a fresh login on every service entry.

Identity **already supports** silent redirect-mode SSO: when `redirect_uri` + `state` are present and the user has a valid Identity session **without** `prompt=login`, `LoginPage` calls `completeAuthRedirect` and issues an auth code back to the consumer — no credentials required.

## Target behaviour

| Scenario | Expected |
|----------|----------|
| User signs in on WebOnOne | JWT stored on WebOnOne origin |
| User opens Data `/login` | Redirect to Identity; if session exists → immediate auth-code callback → Data home **without** login form |
| User opens Email standalone | Same SSO via Identity redirect mode |
| Explicit re-login | Optional `prompt=login` only for "Sign in with different account" (future); not default |
| Session duration | Access token valid **7 days** (configurable via `ACCESS_TOKEN_EXPIRY_SECONDS`) |

## Implementation

### 1. Enable SSO (all consumer FEs)

| Service | File | Change |
|---------|------|--------|
| WebOnOne v2 | `frontend/src/features/auth/utils/buildIdentityLoginUrl.ts` | Remove `prompt: 'login'` from default redirect |
| Data | `data/frontend/.../buildIdentityLoginUrl.ts` | Same |
| Email | `email/frontend/.../buildIdentityLoginUrl.ts` | Same |
| Media | `media/frontend/.../buildIdentityLoginUrl.ts` | Same |

**Optional UX:** `LoginPage` auto-navigates to Identity on mount (existing button behaviour, without extra click).

### 2. Longer session (Identity BE)

| Item | Change |
|------|--------|
| `identity/backend/.env.example` | `ACCESS_TOKEN_EXPIRY_SECONDS=604800` (7 days); document that all consumers inherit this via issued JWT `exp` |
| Comment | Note: refresh tokens remain for Identity standalone UI; consumers use access token until expiry |

### 3. No cross-origin shared storage

Each service SPA keeps its own `sessionStorage` JWT on its origin — SSO is achieved via **Identity session** + auth-code redirect, not shared cookies across `localhost:3000` / `:3005`.

## Acceptance

- [ ] Sign in on WebOnOne → navigate to Data → no Identity login form (auth-code handoff or `/login` auto-SSO)
- [ ] Sign in on Identity → open Data `/login` → lands authenticated without re-entering password
- [ ] `prompt=login` still forces fresh login when explicitly added to URL (Identity behaviour unchanged)
- [ ] Default `ACCESS_TOKEN_EXPIRY_SECONDS` is 7 days in Identity `.env.example`
- [ ] `npm run type-check` passes on identity-root, webonone-v2-root, data-root, email-root, media-root

## ClickUp

Subtask **login session need to increase** (86ey5nqjw).
