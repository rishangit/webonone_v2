# @webonone/platform-nav

Cross-service browser navigation for the WebOnOne platform — auth-code handoff, login redirect, and return URL validation.

## Patterns

| Pattern | API | Use when |
|---------|-----|----------|
| Auth-code handoff | `redirectWithAuthCode()` | Caller has JWT; open another origin's authenticated page |
| Login redirect | `buildLoginRedirectUrl()` + `consumeOAuthState()` | Send unauthenticated user to Identity login |
| Return URL | `parseReturnUrl()` + `stripAuthCodeFromSearch()` | Target page shows "Back to caller" |

## Auth-code handoff

```typescript
import { redirectWithAuthCode } from '@webonone/platform-nav'

await redirectWithAuthCode({
  accessToken,
  authCodeEndpoint: 'http://localhost:4001/api/v1/auth/code',
  targetUrl: 'http://localhost:3001/profile',
  returnUrl: window.location.href,
})
```

The `targetUrl` must be allowlisted on the code issuer (Identity BE `ALLOWED_REDIRECT_URIS`).

## Query params

| Param | Meaning |
|-------|---------|
| `code` | One-time auth code (never JWT in URL) |
| `return_url` | Full URL back to caller |
| `redirect_uri` | OAuth callback URL |
| `return_path` | Path within caller after callback |
| `state` | CSRF nonce |

Constants exported as `QUERY`.

## React hook

```typescript
import { useServiceRedirect } from '@webonone/platform-nav'

const { redirect, isRedirecting, error, clearError } = useServiceRedirect()
```
