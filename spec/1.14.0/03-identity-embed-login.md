# 03 — Identity embed login

ClickUp: [86eydjavx](https://app.clickup.com/t/86eydjavx)

## Problem

Identity `LoginPage` today completes consumer handoff only via **redirect mode** (`completeAuthRedirect` → auth code → consumer `/callback`). When WebOnOne embeds `/login` in an iframe, a top-level redirect would break out of the host and defeat the iframe pattern.

## Target behavior

| Mode | Detection | After successful login |
|------|-----------|------------------------|
| **Embed** | Allowlisted `parentOrigin` query (+ preferably `window.parent !== window`) | `postMessage` `webonone:auth:success` to `parentOrigin` |
| **Redirect** | Allowlisted `redirect_uri` + `state` | Existing `completeAuthRedirect` |
| **Standalone** | Neither | Existing welcome / stay on Identity |

### Mode priority

When WebOnOne iframe URL includes only `parentOrigin` + `returnPath`, use **embed**.  
If a legacy caller still sends `redirect_uri` while framed, prefer **embed** when `parentOrigin` is valid and the page is not the top window — so the iframe never hijacks `window.top`.

## Embed success sequence

```text
1. User submits LoginForm / Google inside iframe
2. Identity BE returns accessToken + user (existing login APIs)
3. LoginPage (embed): window.parent.postMessage(
     { type: 'webonone:auth:success', accessToken, expiresIn, user },
     parentOrigin
   )
4. Do not navigate top window; optional brief “Signed in…” inside iframe
```

### Payload

```json
{
  "type": "webonone:auth:success",
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "id": "…",
    "email": "…",
    "displayName": "…",
    "avatarUrl": null
  }
}
```

Include `avatarUrl` when available (nullable). Match WebOnOne `UserProfile`.

### Forbidden in embed mode

- `window.location.assign` / `replace` to consumer callback
- `window.top.location` changes
- `postMessage(..., '*')`
- Putting JWT in query/hash

## Query preservation

Register and forgot-password links must carry embed params:

```text
/register?parentOrigin=…&returnPath=…
/forgot-password?parentOrigin=…&returnPath=…
```

Extend `withRedirectQuery` (or add `withEmbedQuery`) so both redirect and embed param sets are preserved when present.

After register / reset, return to `/login` with the **same** embed query so the next success still posts to the parent.

## Layout

Reuse current minimal `AuthLayout` for embed and redirect login (no Identity sidebar / platform shell chrome). Standalone logged-in welcome page unchanged.

## Allowlist

Reuse `isAllowedParentOrigin` / `VITE_ALLOWED_PARENT_ORIGINS` (and Vite `frame-ancestors` CSP). Reject unknown `parentOrigin` — treat as non-embed (standalone or redirect only if valid).

## Paths (expected)

| Area | Path |
|------|------|
| Login page | `identity/frontend/src/features/auth/pages/LoginPage.tsx` |
| Redirect completion | `completeAuthRedirect.ts` — skip when embed |
| Query helpers | `redirectQuery.ts` / new embed query helper |
| Parent allowlist | `identity/frontend/src/features/shell/utils/platformConfig.ts` |
| Optional sender | `packages/platform-embed` `sendAuthSuccess(parentOrigin, payload)` |

## Acceptance

1. `/login?parentOrigin=http://localhost:3010` inside iframe posts auth success; parent can establish session.
2. Top window URL remains WebOnOne during the flow.
3. Redirect mode still works without `parentOrigin` (satellite OAuth).
4. Register / forgot keep `parentOrigin` and return to embed login.
