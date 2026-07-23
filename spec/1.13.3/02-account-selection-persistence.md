# 02 — Account selection persistence

The Choose account dialog from [1.13.1](../1.13.1/02-account-selection-dialog.md) must run **once per auth session**, not on every page load.

## Problem (current)

`sessionRole.selectionComplete` lives only in Redux memory. On refresh:

1. Auth token restores from storage (`webonone_auth`).
2. Session role state resets (`selectionComplete: false`).
3. Bootstrap calls `GET /company/me/assumable-roles`.
4. If `requiresAccountSelection` is true, **Choose account opens again**.

That violates “choice lasts until logout.”

## Required behavior

```text
Fresh Identity login (loginSuccess)
        │
        ▼
Clear sticky session selection
        │
        ▼
SessionRoleGate bootstrap
        │
        ├─ Only Default User ──► auto-apply ──► persist selectionComplete
        │
        └─ requiresAccountSelection
                │
                ▼
         Choose account (blocking) ──► Continue ──► persist selection
                │
                ▼
         Dashboard / shell usable

Page refresh (same auth token still stored)
        │
        ▼
Hydrate sticky selection from storage
        │
        ├─ selectionComplete ──► restore activeRole / activeCompanyId ──► NO dialog
        │
        └─ missing / incomplete ──► bootstrap as above (show dialog if required)

Logout or auth cleared
        │
        ▼
Clear sticky selection + auth storage
```

## Persistence contract

Store session selection **with the WebOnOne auth session** (same lifetime as `webonone_auth`), not as a separate forever cookie.

| Field | Type | Meaning |
|-------|------|---------|
| `selectionComplete` | boolean | Gate passed for this auth session |
| `activeRole` | `member` \| `super_admin` \| `company_admin` \| null | Selected platform role |
| `activeCompanyId` | string \| null | Selected company when Company Owner |

Recommended approaches (pick one in implementation; prefer A):

| Option | Approach |
|--------|----------|
| **A (preferred)** | Persist session selection beside auth in service auth storage (or a sibling key cleared with auth). On boot, hydrate Redux from storage when `selectionComplete`. |
| **B** | Persist only a `selectionComplete` flag + restore `activeRole` / `activeCompanyId` by decoding JWT `platform_role` / `company_id` **after** Continue. Still clear flag on `loginSuccess` because Identity may stamp a default `platform_role` (e.g. Super Admin) **before** the user chooses — JWT alone must not skip the first-login dialog. |

**Do not** skip the first-login dialog solely because the JWT already contains `platform_role` (Identity `resolveDefaultSessionClaims` may set Super Admin before Choose account).

## Auth event matrix

| Event | Session selection |
|-------|-------------------|
| `loginSuccess` (callback / embed) | **Reset** — force gate; show dialog if `requiresAccountSelection` |
| Page refresh with stored auth + `selectionComplete` | **Restore** — no dialog |
| `roleSelected` / Continue success | **Persist** complete selection |
| All Companies mid-session Login | **Update** active role/company + persist (still complete) |
| Basic Settings Change → Continue | **Update** + persist |
| `logout` / clear auth | **Clear** selection storage |

## Bootstrap rules (updated)

When hydrating or bootstrapping:

1. If no access token → reset selection; do nothing else.
2. If sticky `selectionComplete` for this user/session → set Redux from sticky values; load assumable roles in background for Change dialog if needed; **do not** open dialog.
3. Else run existing 1.13.1 flow:
   - Fetch assumable roles
   - If `!requiresAccountSelection` → auto Default User (or sole role), persist complete
   - If `requiresAccountSelection` → open Choose account (blocking)

## Dialog modes

| Mode | When | Dismiss |
|------|------|---------|
| **Gate** | Fresh login multi-account | Not dismissible (1.13.1) |
| **Settings Change** | Account tab **Change** | Cancel / Escape / overlay allowed; Cancel keeps current account |

Reuse the same card list and Continue → `POST /auth/session-role` path for both modes.

## Acceptance

1. Multi-account: login → choose → Continue → hard refresh → no dialog; same account.
2. Multi-account: logout → login → dialog shows again.
3. Default-User-only: never shows dialog; refresh still fine.
4. Super Admin / company owner: first login still shows dialog even if JWT had a default claim.
5. Mid-session All Companies Login still updates the active account and survives refresh.
