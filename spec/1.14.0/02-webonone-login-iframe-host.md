# 02 — WebOnOne `/login` iframe host

ClickUp: [86eydjavt](https://app.clickup.com/t/86eydjavt)

## Problem

`LoginPage` currently calls `window.location.assign(buildIdentityLoginUrl(…))`, sending the user to the Identity origin. The platform already embeds many peer pages in iframes; login should follow that pattern so the browser **stays on WebOnOne**.

## Target UX

| Step | Behavior |
|------|----------|
| Open `/login` | WebOnOne shell/page stays; Identity AuthLayout appears in a full-width iframe |
| Sign in | User interacts only inside the iframe |
| Success | Parent stores JWT + user; navigates to `returnPath` (default `/`) without a visible Identity URL |
| Identity down | Friendly error + Retry that reloads the iframe `src` — not a top-level redirect |

WebOnOne **must not** render username, password, or Google button fields itself.

## Frame URL

Build from existing config (`identityConfig.ts`):

```text
{identityOrigin}/login
  ?parentOrigin={encodeURIComponent(window.location.origin)}
  &returnPath={encodeURIComponent(returnPath)}
```

| Param | Source | Notes |
|-------|--------|-------|
| `parentOrigin` | `window.location.origin` | Required; Identity allowlists before postMessage |
| `returnPath` | Prop / default `/` | Parent navigates here after success (Identity may echo in message or parent keeps local state) |

**Do not** add `redirect_uri` / `state` on the WebOnOne iframe path (that is redirect OAuth).

**Env:** only `VITE_IDENTITY_ORIGIN` (+ API base for other features). Derive `/login` in code — no `VITE_IDENTITY_LOGIN_URL` (forbidden redundant peer path env).

### Helper (conceptual)

```ts
function buildIdentityEmbedLoginUrl(returnPath = '/'): string {
  const url = new URL(getIdentityLoginUrl())
  url.searchParams.set('parentOrigin', window.location.origin)
  url.searchParams.set('returnPath', returnPath)
  return url.toString()
}
```

## Components

### `LoginPage`

- Route: `/login` (unchanged in `router.tsx`).
- Renders `PageShell` (or minimal guest shell) + `IdentityLoginFrame`.
- Remove auto-redirect `useEffect` and primary “Continue to sign in” redirect CTA.
- Optional: if already authenticated, `<Navigate to="/" replace />`.

### `IdentityLoginFrame`

- `<iframe title="Sign in" src={embedLoginUrl} className="…" />` — full available height/width for auth card.
- Registers `useIdentityAuthMessage`.
- On `load`, parent posts theme apply into `iframe.contentWindow` (see [04](./04-auth-postmessage-contract.md)).

### `useIdentityAuthMessage`

- Listen `window` `message`.
- Require `event.origin === getIdentityOrigin()` (normalize trailing slash).
- On `webonone:auth:success`: validate payload shape; `dispatch(authActions.loginSuccess(…))`; `navigate(returnPath, { replace: true })`.
- On `webonone:auth:cancel`: optional stay on `/login` or show soft message.
- Ignore unknown types.

Existing types live at `webonone-v2/frontend/src/shared/embed/embed.types.ts` (`EmbedPostMessageAuthSuccess`). Prefer consolidating into `@webonone/platform-embed` if both sides import shared constants.

## Auth session

Reuse current Redux `authSlice.loginSuccess` path used by `AuthCallbackPage` — same `accessToken` + `UserProfile` shape (`id`, `email`, `displayName`, `avatarUrl`).

## Relationship to `/callback`

| Path | Role after 1.14.0 |
|------|-------------------|
| `/login` | **Primary** WebOnOne sign-in (iframe) |
| `/callback` | Auth-code exchange for redirect/OAuth consumers only |

Do not delete `AuthCallbackPage` or exchange client code.

## Paths (expected)

| Area | Path |
|------|------|
| Login page | `webonone-v2/frontend/src/features/auth/pages/LoginPage.tsx` |
| Frame + hook | `webonone-v2/frontend/src/features/auth/components/IdentityLoginFrame.tsx` (or similar) |
| Config | `webonone-v2/frontend/src/features/auth/utils/identityConfig.ts` |
| Types | `webonone-v2/frontend/src/shared/embed/embed.types.ts` and/or `packages/platform-embed` |
| Redirect helper | `buildIdentityLoginUrl.ts` — keep for any remaining redirect callers; **not** used by `/login` |

## Acceptance

1. Visiting `/login` does not change `location.origin` to Identity.
2. Successful iframe login yields the same session as today’s `/callback` exchange.
3. No local login form fields in WebOnOne source.
4. Theme in the iframe matches WebOnOne guest/platform theme after load.
