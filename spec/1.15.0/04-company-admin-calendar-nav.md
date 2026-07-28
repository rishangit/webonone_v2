# 04 — Company admin Calendar navigation

ClickUp: TBD

## Problem

Company admins have no entry point to a calendar. Navigation for `company_admin` is driven by **`MAIN_PLATFORM_NAV`** in `@webonone/platform-nav` and rendered by WebOnOne `buildNavForSessionRole` ([platform-shell-navigation.mdc](../../.cursor/rules/platform-shell-navigation.mdc), session role → `main`).

## Nav definition

Add a **top-level item** (not under Settings) to `MAIN_PLATFORM_NAV` in `packages/platform-nav/src/coreNav.ts`:

```ts
{ kind: 'item', path: '/calendar', label: 'Calendar' }
```

**Placement:** immediately after **Home** (before Identity group) so Calendar is easy to find:

```text
Home
Calendar          ← new
Identity
  Users / Staff
Data
…
```

Do **not** add to `MEMBER_PLATFORM_NAV` or `SUPER_ADMIN_PLATFORM_NAV` in 1.15.0.

## Core-owned route (not a peer sentinel)

| Aspect | Value |
|--------|--------|
| Path | `/calendar` |
| `externalService` | **omit** — WebOnOne owns the page |
| Channel | Local `navigate` inside AppShell — **not** iframe embed, **not** auth-code redirect |

Update `packages/platform-nav` tests (`coreNav.test.ts`) so `getPlatformNavDefs('main')` includes Calendar and member/superAdmin defs do not.

## WebOnOne icon wiring

In `webonone-v2/frontend/src/features/shell/config/navItems.ts`:

1. Import Lucide **`Calendar`**.
2. Map `'/calendar': Calendar` in `ICON_BY_PATH`.

No change to Email/Data/SMS sentinel helpers.

## Role visibility

| Session role | Nav variant | Sees Calendar |
|--------------|-------------|---------------|
| `company_admin` | `main` | **yes** |
| `member` | `member` | no |
| `super_admin` | `superAdmin` | no |

Guarding the **route** is specified in [05](./05-calendar-page.md) — nav omission alone is not enough (typed URL).

## Build order

After editing platform-nav:

```bash
npm run build:platform-nav
```

WebOnOne already depends on `@webonone/platform-nav`; ensure service `build` still chains `build:platform-nav` (existing pattern).

## Forbidden

- Hard-coding a Calendar nav item only in WebOnOne without updating `MAIN_PLATFORM_NAV` (peers that reuse defs would drift)
- Using an Email/Data-style sentinel for a core page
- Showing Calendar under Settings

## Verification

```bash
npm run build:platform-nav
npm run type-check -w webonone-v2-root
```

Manual: company_admin session → left nav shows Calendar with calendar icon → click → `/calendar`.
