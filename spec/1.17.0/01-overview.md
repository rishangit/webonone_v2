# 01 — Overview (1.17.0)

## Vision

Guests who hit an authentication wall should never lose their place. The platform remembers the **requested page**, completes login (Google Sign-In or email/password via Identity embed), and restores that page — or a safe default homepage when the return target cannot be trusted.

## User story

**As a** visitor who is not logged in,  
**I want** to be returned to the exact page I was viewing after I successfully sign in,  
**So that** I can continue my task without searching again for the same company, service, or page.

## Goals (1.17.0)

1. **Capture before login** — When a guest action requires auth (e.g. booking, contact, protected feature), store the current page URL/path before navigating to login.
2. **Preserve through login** — WebOnOne `/login` accepts and validates a return target (website full URL and/or same-app path).
3. **Restore after success** — After Identity iframe success (Google or email/password), redirect to the validated requested page — not always WebOnOne `/`.
4. **Safe fallback** — Missing or invalid return → default homepage (website origin `/` for website handoffs; WebOnOne `/` for core-only logins).
5. **No open redirects** — Only allowlisted website origins (and same-origin WebOnOne paths); never put tokens in `return_url`.

## Scope (1.17.0)

### In scope

- Fix website `return_url` handling so **path + safe query** survive login (today stripped to origin root in `parseWebsiteReturnUrl`).
- Wire WebOnOne post-login navigation (`useIdentityAuthMessage`, already-authenticated `WebsiteReturnRedirect`) to the validated full return URL.
- Support WebOnOne **same-origin** return paths when login is entered from a protected core route (query or sessionStorage — implementer’s choice, documented in [02](./02-post-login-return-page.md)).
- Website CTAs that already call `getWebOnOneLoginUrl(currentPage)` keep working; audit call sites that omit the current page.
- Acceptance coverage for Google and email/password (both complete via the same Identity → postMessage path).

### Out of scope (1.17.0)

- Changing Identity login UI, OAuth providers, or JWT claims.
- New microservices or shared databases.
- Remembering return across **logout** (logout may still land on `/login?prompt=login`).
- Deep-linking into peer iframes (Email/Data/SMS) as return targets — return targets are website pages or WebOnOne top-level routes only.
- Mobile Expo app return flows.

## Glossary

| Term | Definition |
|------|------------|
| **Requested page** | The URL/path the guest was on (or intended to open) when auth was required |
| **Return target** | Validated requested page used after successful login |
| **Website handoff** | `return_url` on WebOnOne `/login` pointing at an allowlisted **website** origin; session returned via auth-code redirect |
| **Core return path** | Same-origin WebOnOne path (e.g. `/settings/basic`) used after iframe login when not returning to the website |
| **Default homepage** | Website: `{websiteOrigin}/`; WebOnOne-only: `/` |
| **Allowlist** | `VITE_WEBSITE_ALLOWED_ORIGINS` / website origin patterns — reject foreign hosts |

## Success criteria

1. Guest on a deep website page triggers login → after Google **or** email/password success → lands on that **same** path (not only website origin `/`).
2. Guest enters WebOnOne login from a protected core route with a captured return path → after login → lands on that path (not always `/`).
3. Missing, malformed, or non-allowlisted `return_url` → default homepage; no open redirect.
4. Tokens / passwords never appear in `return_url` query or hash.
5. `npm run type-check -w webonone-v2-root` passes; website type-check passes if website files change.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — Return user to requested page after login | [86eyhz4mr](https://app.clickup.com/t/86eyhz4mr) | All |
| Remember page → login → restore (Google / email); homepage fallback | [86eyhz6wv](https://app.clickup.com/t/86eyhz6wv) | [02-post-login-return-page.md](./02-post-login-return-page.md) |
