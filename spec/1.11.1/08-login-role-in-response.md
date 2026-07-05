# 08 — Login response includes session role (delta)

## Problem

In production, **super admin** users sign in successfully but satellite apps (Data, Email, WebOnOne) treat them as **`member`** — permissions and nav are wrong.

Symptoms:

- JWT from login/auth-code exchange lacks `platform_role` when the user has **multiple assignable roles** (e.g. `super_admin` plus company-scoped roles).
- Auth JSON responses expose only `user` profile fields — no explicit `platformRole` / `companyId` — so consumers must decode JWT or call `/me`, and default to `member` when the claim is absent.

Subtask: **in production super admin login user role not taken** (86ey5pc30).

## Root cause

| Area | Issue |
|------|-------|
| `resolveDefaultSessionClaims` | Returns `null` when `getAssumableRoles` returns **more than one** option — no `platform_role` embedded in the access token |
| `buildAuthResponse` / `exchangeAuthCode` | Response body omits session role fields even when claims are present in the signed JWT |
| Production deploy | `users_roles` super-admin row depends on `SUPER_ADMIN_USER_ID` + `npm run seed -w identity-backend` after migrate |

Super admins with company membership hit the multi-role path and receive a token without `platform_role`. Consumer middleware and `/me` endpoints default to `member`.

## Required fix

### Identity backend

| Area | Action |
|------|--------|
| `resolveDefaultSessionClaims` | When user has assignable `super_admin`, **auto-select** `{ platformRole: 'super_admin', companyId: null }` even if other roles exist (super admin is the safe production default; WebOnOne role dialog still allows switching) |
| `buildAuthResponse` | Add optional `platformRole` and `companyId` mirroring JWT session claims |
| `issueAuthTokens`, `exchangeAuthCode`, `refreshAccessToken`, `reissueSessionRole` | Pass resolved session claims into `buildAuthResponse` |
| `.env.example` | Document that production must set `SUPER_ADMIN_USER_ID` and run seed after migrate |

### Consumer frontends (optional hardening)

| Area | Action |
|------|--------|
| Data `AuthCallbackPage` / `usePlatformSessionBootstrap` | Prefer `platformRole` from auth response when present; fall back to `fetchDataRole` |
| Email / WebOnOne auth callback | Same pattern if they hard-code `member` before role fetch |

Consumers continue to verify permissions from JWT on the backend — response fields are a convenience for immediate UI bootstrap.

## Auth response shape (additions)

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 604800,
  "user": { "id": "...", "email": "...", "displayName": "..." },
  "platformRole": "super_admin",
  "companyId": null
}
```

When session role is not yet determined (non–super-admin multi-role without auto-default), omit `platformRole` — frontend shows role dialog (WebOnOne) or defaults via `/me`.

## Acceptance

- Super admin login (standalone and auth-code exchange) returns JWT **with** `platform_role: super_admin` and JSON `platformRole: super_admin`
- Data super-admin catalog mutations work immediately after login without manual role selection
- Single-role users unchanged
- Multi-role non–super-admin users still require role dialog on WebOnOne
- `npm run type-check -w identity-root` passes

## ClickUp

Subtask **in production super admin login user role not taken** (86ey5pc30).
