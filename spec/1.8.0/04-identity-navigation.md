# 04 — Identity Standalone Navigation

Dual sidebar modes for **Identity**: **Identity nav** when standalone, **core/WebOnOne nav** when redirected from the core platform.

Related: [../1.2.0/03-app-shell-navigation.md](../1.2.0/03-app-shell-navigation.md), [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md).

---

## Problem (current state)

Identity `AppLayout` uses **`PageShell`** only — header + centered `<Outlet />`. There is no left navigation when running standalone on port **3001**. Profile shows an inline **Back to WebOnOne** link when `return_url` is present; other account routes have no persistent nav.

---

## Dual navigation modes

Mode is determined by validated **`return_url`** in the query string (`parseProfileReturnUrl()`).

| Mode | Trigger | Sidebar | Header logo |
|------|---------|---------|-------------|
| **Standalone** | No `return_url` | Identity nav only | **Identity** |
| **Core redirect** | Valid `return_url` | Core/WebOnOne nav only | **WebOnOne** |

The two nav bars are **mutually exclusive** — never shown together.

### Standalone mode

When Identity runs as its own app (no `return_url`), shell routes render inside **`AppShell`** with Identity sidebar:

| Nav item | Route | Icon (suggested) | Notes |
|----------|-------|------------------|-------|
| Home | `/login` | `Home` | Standalone welcome + sign-in; active when pathname is `/login` |
| Profile | `/profile` | `User` | Requires session; redirects to `/login` when unauthenticated |
| User register | `/register` | `UserPlus` | `RegisterPage` |
| Reset password | `/reset-password` | `KeyRound` | `ResetPasswordPage` (token from email link) |

### Standalone welcome / login (`/login`)

When Identity runs standalone (no `redirect_uri`, no `return_url`), `/login` renders inside **`AppShell`** with the Identity sidebar:

| Element | Requirement |
|---------|-------------|
| Layout | `FeaturePage` from `@webonone/ui-kit` — same header/body contract as WebOnOne feature pages |
| Title | `Welcome to Identity` when signed out; `Welcome, {displayName}!` when signed in |
| Description | Short subtitle (e.g. sign-in prompt or signed-in confirmation) |
| Body | Sign-in form (Google + email) when signed out; signed-in status when session exists |
| Sidebar | Identity nav only — includes **Home** → `/login` |

Embed/redirect login (`redirect_uri` present) keeps **`PageShell`** + centered **`AuthLayout`** — no sidebar (OAuth handoff entry point unchanged).

### Core redirect mode

When WebOnOne redirects to Identity profile via auth-code handoff (`return_url` + optional `core_nav`):

1. Show **only** the core platform sidebar — same structure as WebOnOne `AppShell` (Home, Settings, …; Companies for super admin).
2. Nav links are **absolute URLs** to the core origin derived from `return_url` (e.g. `http://localhost:3000/settings/basic`).
3. Do **not** show Identity nav items (Profile, Register, Reset password).
4. Header logo reads **WebOnOne**.

**Super-admin variant:** WebOnOne passes `core_nav=super_admin` in redirect query params when the user is a super admin. Identity defaults to `main` when absent.

---

## Shared nav contract (`@webonone/platform-nav`)

Path-only nav trees live in `packages/platform-nav/src/coreNav.ts`:

| Export | Purpose |
|--------|---------|
| `MAIN_PLATFORM_NAV` | Home + Settings group |
| `SUPER_ADMIN_PLATFORM_NAV` | Home + Companies + Settings group |
| `getCoreOriginFromReturnUrl()` | Parse core origin from `return_url` |
| `resolvePlatformNavUrls(origin, variant)` | Absolute hrefs for Identity |
| `CORE_NAV_QUERY_PARAM` | Query key `core_nav` |
| `toCoreNavQueryValue()` / `parsePlatformNavVariant()` | `main` ↔ `super_admin` |

WebOnOne builds relative `NavConfigItem[]` from the same path defs. Identity maps icons locally when converting resolved URLs to `NavConfigItem[]`.

---

## Implementation (Identity frontend)

| File | Change |
|------|--------|
| `identity/frontend/src/features/shell/config/navItems.ts` | `buildStandaloneNav()`, `buildCoreNavFromQuery()` |
| `identity/frontend/src/app/AppLayout.tsx` | Switch nav + logo by `return_url`; standalone `/login` uses `AppShell` |
| `identity/frontend/src/features/auth/pages/LoginPage.tsx` | Standalone: `FeaturePage` welcome + sign-in body; redirect: centered `AuthLayout` |
| `identity/frontend/src/features/profile/pages/ProfilePage.tsx` | No inline back link (sidebar owns return in core mode) |

---

## WebOnOne redirect wiring

| File | Change |
|------|--------|
| `webonone-v2/frontend/src/features/auth/utils/redirectToIdentityProfile.ts` | Pass `core_nav` via `extraSearchParams` |
| `webonone-v2/frontend/src/app/AppLayout.tsx` | Pass `navVariant` from `useSuperAdminStatus()` |
| `webonone-v2/frontend/src/features/shell/config/navItems.ts` | Build from shared `platform-nav` paths |

---

## Shell route list

```typescript
const IDENTITY_SHELL_ROUTES = ['/login', '/profile', '/register', '/reset-password'] as const
```

`AppLayout` uses **`AppShell`** for shell routes when **not** in OAuth redirect mode (`redirect_uri`). Redirect-mode `/login` stays on **`PageShell`**.

---

## Out of scope

| Item | Reason |
|------|--------|
| Identity login/register embed mode | `redirect_uri` OAuth flow unchanged; sidebar hidden on `/login` |
| Backend API changes | Frontend layout only |
| Active highlight on core nav while on Identity `/profile` | Core routes are external; no item matches Identity pathname |

---

## Success criteria

1. Standalone Identity (`:3001`) shows Identity sidebar on `/login` (welcome page), profile, register, and reset-password routes.
2. Redirect from WebOnOne shows core sidebar only (Home + Settings, or Companies for super admin).
3. Core nav links navigate to WebOnOne routes on the core origin.
4. `npm run type-check -w identity-root` passes.
