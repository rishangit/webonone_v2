# 04 — Profile Return Avatar Sync

When WebOnOne redirects the user to Identity `/profile` (auth-code handoff), the user may change their profile image and save. Returning to WebOnOne via **Back to WebOnOne** must show the **updated avatar** in the `AppShell` header.

---

## Problem

WebOnOne stores `user.avatarUrl` in Redux + `sessionStorage` at login/callback. A plain link back to WebOnOne does not refresh that snapshot, so the header shows the old image.

---

## Solution

WebOnOne FE refreshes the Identity user profile while the session is active:

| Trigger | Action |
|---------|--------|
| `AppLayout` mount | `GET {VITE_IDENTITY_API_BASE_URL}/me` with `Authorization: Bearer <accessToken>` |
| `document.visibilitychange` → `visible` | Same refresh (user returns from Identity tab) |

On success, dispatch `userProfileUpdated` to merge `displayName`, `avatarUrl`, and other public fields into the auth slice and persist to `sessionStorage`.

---

## API

```http
GET /api/v1/me HTTP/1.1
Host: localhost:4001
Authorization: Bearer <accessToken>
```

Response user DTO matches login exchange payload (includes `avatarUrl`).

---

## Files (expected)

| File | Role |
|------|------|
| `webonone-v2/frontend/src/features/auth/services/identityUserApi.ts` | `fetchIdentityUser(accessToken)` |
| `webonone-v2/frontend/src/features/auth/hooks/useIdentityUserRefresh.ts` | Mount + visibility refresh |
| `webonone-v2/frontend/src/features/auth/store/authSlice.ts` | `userProfileUpdated` reducer |
| `webonone-v2/frontend/src/app/AppLayout.tsx` | Call refresh hook |

---

## Acceptance

1. Open WebOnOne → profile (Identity) → edit avatar → save → Back to WebOnOne.
2. Header avatar matches the new image without signing in again.
3. No JWT or tokens in URL query params.

---

## Media selector thumb default (same subtask)

`ScopedFolderBrowser` in `media/frontend` defaults `viewMode` to `'thumb'` so the selector file dialog shows thumbnail grid on first open.
