# 02 — Post-login return to requested page (1.17.0)

ClickUp: [86eyhz6wv](https://app.clickup.com/t/86eyhz6wv)

## Requirement (from ClickUp)

When a guest user attempts an action that requires authentication (such as booking an appointment, contacting a company, or accessing a protected feature), the system must **remember the current page** before redirecting to the login screen.

After a successful login (**Google Sign-In** or **email/password**), redirect the user back to the **originally requested page** instead of always navigating to the WebOnOne home page.

If no valid return page exists, redirect to the **default homepage**.

## Current behavior (gap)

| Location | Behavior today |
|----------|----------------|
| `website/.../webononeConfig.ts` `getWebOnOneLoginUrl` | Can pass full `return_url` including path |
| `webonone-v2/.../websiteConfig.ts` `parseWebsiteReturnUrl` | Validates allowlisted origin, then **normalizes to `{origin}/`** — **drops path/query** |
| `webonone-v2/.../LoginPage.tsx` | Hardcodes `LOGIN_RETURN_PATH = '/'` for iframe `returnPath` |
| `useIdentityAuthMessage` | Navigates to `returnPath` or auth-codes to `websiteReturnUrl` |
| Identity embed | Google and email/password both succeed via `webonone:auth:success` — return logic is entirely on WebOnOne |

## Target behavior

```text
Guest on page P
  → auth-required action
  → navigate to WebOnOne /login with return target = P (validated)
  → Identity iframe (Google or email/password)
  → webonone:auth:success
  → if P is website URL: auth-code redirect to full P
  → if P is WebOnOne path: navigate(P)
  → if P invalid/missing: default homepage
```

## Functional rules

### 1. Capture before login

| Surface | Capture rule |
|---------|----------------|
| **Website** | Auth CTAs must call `getWebOnOneLoginUrl` with the **current** absolute path or full URL (`window.location.href` or `pathname + search`). Do not omit the argument when the user is on a deep page. |
| **WebOnOne** | When redirecting an unauthenticated user to `/login` from a protected route, pass a **same-origin return path** (query param such as `return_path` / `returnPath`, or short-lived `sessionStorage` key — pick one pattern and use it consistently). |

Secrets must never be placed in the return target.

### 2. Validate return target

Extend (or replace) `parseWebsiteReturnUrl` so a valid website return:

- Parses as `http:` / `https:` URL
- Origin matches **website allowlist** (`VITE_WEBSITE_ALLOWED_ORIGINS` / `getWebsiteAllowedOriginPatterns()`)
- Returns the **full** URL string including **pathname** and **search** (hash optional; prefer dropping hash if unused)
- Rejects foreign hosts, `javascript:`, and malformed values → `null`

For **WebOnOne-only** return paths:

- Must be a path starting with `/` (relative to WebOnOne origin)
- Reject absolute URLs to other origins
- Reject protocol-relative URLs
- Optional: reject known auth routes that would loop (`/login`, `/callback`) → treat as invalid → homepage

Reuse `@webonone/platform-nav` helpers where they already validate origins (`parseReturnUrl` already returns full URL). Prefer aligning website parsing with that contract instead of a one-off strip-to-root.

### 3. Restore after login

| Case | After Identity success |
|------|-------------------------|
| Valid **website** return URL | `redirectToWebsiteWithAuthCode(accessToken, fullReturnUrl)` (existing helper; pass full URL) |
| Valid **WebOnOne** return path | `navigate(returnPath, { replace: true })` |
| Invalid / missing | Website intent unclear → WebOnOne `/`; if login was entered only for website but URL invalid → website homepage when origin is known, else WebOnOne `/` |

Already-authenticated users hitting `/login?return_url=…` (`WebsiteReturnRedirect`) must use the **same** validated full URL (not origin root).

Google vs email/password: **no separate branches** — both complete through Identity embed postMessage; fixing WebOnOne restore covers both.

### 4. Fallback homepage

| Context | Default |
|---------|---------|
| Website handoff invalid | `{allowedWebsiteOrigin}/` when a single default website origin exists; else WebOnOne `/` |
| Core-only login invalid | `/` |

## Security

- **Allowlist only** — no open redirects.
- **No tokens** in return URL query/hash.
- **postMessage** origin checks unchanged ([1.14.0 auth contract](../1.14.0/04-auth-postmessage-contract.md)).
- Auth-code `targetUrl` for website must remain an allowlisted website URL (Identity / platform-nav already constrain redirect consumers).

## Implementation touchpoints (expected)

| Area | Likely files |
|------|----------------|
| Website return parse | `webonone-v2/frontend/src/features/auth/utils/websiteConfig.ts` |
| Login host | `LoginPage.tsx`, `IdentityLoginFrame.tsx`, `useIdentityAuthMessage.ts` |
| Website → login | `website/frontend/src/features/webonone/utils/webononeConfig.ts` + CTA call sites |
| Shared validation | `packages/platform-nav/src/returnUrl.ts` (optional alignment) |
| Tests | Unit tests for parse helpers (path kept, bad origin rejected, loop paths rejected) |

## Acceptance (this subtask)

- [ ] Deep website page → login → Google success → same deep page
- [ ] Deep website page → login → email/password success → same deep page
- [ ] Invalid `return_url` → homepage; no navigation to attacker host
- [ ] WebOnOne protected entry with return path → post-login lands on that path
- [ ] Missing return → WebOnOne `/` (or website `/` when that was the only intent and origin is known)
