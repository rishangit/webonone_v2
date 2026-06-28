# 04 — Identity Standalone Navigation

Left sidebar navigation for **Identity** when the service runs standalone (`npm run dev:identity`), plus a **core return** link when the user arrives from WebOnOne via auth-code handoff.

Related: [../1.2.0/03-app-shell-navigation.md](../1.2.0/03-app-shell-navigation.md), [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md).

---

## Problem (current state)

Identity `AppLayout` uses **`PageShell`** only — header + centered `<Outlet />`. There is no left navigation when running standalone on port **3001**. Profile shows an inline **Back to WebOnOne** link when `return_url` is present; other account routes have no persistent nav.

---

## Requirements (subtask: need to have the left navigation for the identity service)

### Standalone mode

When Identity runs as its own app (no `return_url` in the URL), authenticated and account-management routes render inside **`AppShell`** with a left sidebar.

| Nav item | Route | Icon (suggested) | Notes |
|----------|-------|------------------|-------|
| Profile | `/profile` | `User` | Requires session; redirects to `/login` when unauthenticated |
| User register | `/register` | `UserPlus` | `RegisterPage` |
| Reset password | `/reset-password` | `KeyRound` | `ResetPasswordPage` (token from email link) |

`/login` remains **`PageShell`** + **`AuthLayout`** — no sidebar (OAuth redirect entry point).

`/forgot-password` is reachable from login footer; optional fourth nav item is **out of scope** unless added later.

### Core redirect mode

When WebOnOne redirects to Identity profile (or other shell route) with a validated **`return_url`** query param (via `@webonone/platform-nav`):

1. Prepend a **core return** nav item at the top of the sidebar — label **WebOnOne**, `href` = validated `return_url`, icon `ArrowLeft` (or `Home`).
2. Remove the duplicate inline **Back to WebOnOne** button from `ProfilePage` — the sidebar owns return navigation.
3. Identity nav items remain below the core return link.

Validation reuses `parseProfileReturnUrl()` and `getAllowedRedirectPatterns()` — no new env keys.

---

## Implementation (Identity frontend)

| File | Change |
|------|--------|
| `identity/frontend/src/features/shell/config/navItems.ts` | `standaloneNav`, `buildIdentityNav(returnUrl?)` |
| `identity/frontend/src/app/AppLayout.tsx` | `AppShell` for shell routes; `PageShell` for `/login` |
| `identity/frontend/src/features/profile/pages/ProfilePage.tsx` | Remove inline back link; rely on sidebar |

Nav config uses `NavConfigItem[]` from `@webonone/ui-kit`. External return link uses full URL as `to` on `NavItem` (`<a href>`).

---

## Shell route list

```typescript
const IDENTITY_SHELL_ROUTES = ['/profile', '/register', '/reset-password'] as const
```

---

## Out of scope

| Item | Reason |
|------|--------|
| WebOnOne nav items inside Identity | Core return link only — WebOnOne owns its own `AppShell` |
| Identity login/register embed mode | `redirect_uri` OAuth flow unchanged; sidebar hidden on `/login` |
| Backend API changes | Frontend layout only |

---

## Success criteria

1. Standalone Identity (`:3001`) shows left nav on profile, register, and reset-password routes.
2. Nav items match the table above with icon + label.
3. Redirect from WebOnOne profile handoff shows **WebOnOne** return item + Identity nav.
4. `npm run type-check -w identity-root` passes.
