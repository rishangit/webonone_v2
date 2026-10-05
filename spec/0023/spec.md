# Feedback 0023 — Unable to sign out from the Support header

| Field | Value |
|-------|-------|
| Ticket | `0023` |
| Feedback id | `qc8XFtn7NYsGe9lHwh-KY` |
| Type | `bug` |
| Title | Unnable to sign out from the support header |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

On the Support help site, **Sign out** in the header user menu clears only the Support Redux/`localStorage` JWT. Identity SSO stays active, so the next Sign In (or any Identity handoff) silently re-authenticates the user. Sign out must revoke the Identity session and leave the user on the public Support site as a guest.

## Problem / goal

**Problem:** `SupportHeader` dispatches `authActions.logout()` only. Unlike other satellite FEs (Email, Media, Data), it does not call `performPlatformLogout` with Identity `/logout`. Users report that after Sign out they are signed in again, and they expect to see the public help site (guest chrome: Sign In, no avatar menu).

**Goal:** Header Sign out clears Support auth storage, routes through Identity logout to revoke SSO, then lands on the public Support home as a guest.

## Acceptance criteria

1. Header user menu **Sign out** clears Support auth (`support_auth` / `clearSupportAuthStorage`) before navigation.
2. Sign out calls `performPlatformLogout` with `identityOrigin` so Identity `/logout` runs (SSO revoked).
3. After logout, the user lands on the public Support site (home `/`) as a guest — Sign In visible, avatar / Sign out menu gone — not auto re-logged in via silent SSO.
4. Sign out does not leave the user stuck on Support `/login` (which immediately redirects to Identity and would look like “relogin”).
5. Touched workspaces pass `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend`.

## Services affected

| Area | Change |
|------|--------|
| `support/frontend` | `SupportHeader` logout → clear storage + `performPlatformLogout` |
| `spec/0023/` | This package |

## Out of scope

- Changing Identity `LogoutPage` allowlist or `prompt=login` append behavior
- WebOnOne / other satellite logout (already use `performPlatformLogout`)
- Support help Markdown (bug fix; no new user-facing feature)
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual: `npm run dev:support` → Sign In → open user menu → Sign out → public home with Sign In (no avatar); Sign In again shows Identity login (no silent SSO).
