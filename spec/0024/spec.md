# Feedback 0024 — Auto-relogin with the previous user in Support when clicking Bug & Feature

| Field | Value |
|-------|-------|
| Ticket | `0024` |
| Feedback id | `H_a36KioeTwfI7jX4ChAp` |
| Type | `bug` |
| Title | Auto-relogin with the previous user in support when clicking the bug & feature |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the Support help site, a guest who opens **Bug & Feature** (or **Sign In**) is redirected to Identity. If an Identity SSO session still exists for a previous user, Support completes login silently and lands on `/feedback` as that user. Guests must see the Identity login page and choose credentials — not inherit the previous SSO session.

## Problem / goal

**Problem:** `PrivateRoute` sends unauthenticated users to Support `/login`, which immediately calls `buildIdentityLoginUrl` without `prompt=login`. Identity therefore reuses the existing SSO session and auto-completes the OAuth redirect for the previous user.

**Goal:** Support-initiated login always forces interactive Identity login (`prompt=login`) so Bug & Feature / Sign In show the login UI instead of silent re-auth.

## Acceptance criteria

1. Guest Support → click **Bug & Feature** (or sidebar feedback nav) → Identity login form is shown (credentials / Google), not silent SSO into the previous user.
2. Guest Support → header **Sign In** → same interactive Identity login (no silent previous-user re-auth).
3. Support `buildIdentityLoginUrl` includes `prompt=login` on the Identity login redirect URL.
4. After a successful interactive login, the user lands on the intended return path (default `/feedback`).
5. Touched workspaces pass `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend`.

## Services affected

| Area | Change |
|------|--------|
| `support/frontend` | Force `prompt=login` on Identity login redirect from Support |
| `spec/0024/` | This package |

## Out of scope

- Changing Identity `LoginPage` / `usePromptLoginSessionClear` behavior (already honors `prompt=login`)
- WebOnOne or other satellite silent-SSO defaults
- Support Sign out flow (covered by feedback 0023)
- Support help Markdown (bug fix; no new user-facing feature)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: `npm run dev:support` (+ Identity) → open Support as guest with an existing Identity SSO session → Bug & Feature → Identity login form (not auto `/feedback` as previous user) → sign in → `/feedback`.
