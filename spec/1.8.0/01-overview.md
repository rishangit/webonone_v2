# 01 — Overview (1.8.0)

## Vision

Every authenticated **feature page** rendered inside `AppShell`'s main content area shares the same visual structure: a **title header** at the top, **full-width** page body within the shell main region, and **consistent vertical spacing** between the header and page body.

## User story

As a user, I want all feature pages to have a consistent structure within the main content area, so that each page is easy to navigate and visually uniform.

## Goals

1. Export **`PageHeader`** and **`FeaturePage`** from `@webonone/ui-kit`.
2. **`PageHeader`** — title (`h1`), optional description, optional trailing actions slot.
3. **`FeaturePage`** — wraps page body in `w-full flex flex-col gap-6` (full width of shell main content).
4. Refactor WebOnOne v2 feature pages that render inside `AppShell` to use the shared layout.
5. Add **`feature-page-layout.mdc`** so agents and developers apply the same pattern on new pages.
6. Showcase demo documenting the layout contract.
7. Add **Identity dual sidebar navigation** — Identity nav when standalone; full core/WebOnOne nav when redirected (`return_url` + `core_nav`).

## In scope

| Item | Detail |
|------|--------|
| `PageHeader` | `ui-kit/package/src/layouts/PageHeader.tsx` |
| `FeaturePage` | `ui-kit/package/src/layouts/FeaturePage.tsx` |
| Public export | `ui-kit/package/src/index.ts` |
| Showcase demo | Layout section on Components or dedicated showcase page |
| WebOnOne refactor | `HomePage`, `BasicSettingsPage`, `CompaniesPage`, `SystemThemePage` |
| Cursor rule | `.cursor/rules/feature-page-layout.mdc` + index in `.cursor/rules/README.md` |
| Identity nav | Dual `AppShell` sidebar per [04-identity-navigation.md](./04-identity-navigation.md) |
| Platform nav | `packages/platform-nav/src/coreNav.ts` — shared core path trees |

## Out of scope

| Item | Reason |
|------|--------|
| `AppShell` / sidebar changes | Shell chrome unchanged ([1.2.0](../1.2.0/03-app-shell-navigation.md)) |
| Auth / embed layouts | `AuthLayout`, `PageShell`, Media `EmbedLayout` keep their own patterns |
| Identity profile page layout | Centered card layout is intentional for `/profile` body — only shell nav is new |
| Media iframe embed pages | Chromeless embed routes excluded |
| Backend API changes | Frontend-only layout spec |

## Glossary

| Term | Meaning |
|------|---------|
| **Feature page** | Route-level page inside `AppShell` `<Outlet />` (not auth, not iframe embed) |
| **PageHeader** | Title block: `h1` + optional description + optional actions |
| **FeaturePage** | Outer wrapper: full shell width + `gap-6` between header and body |
| **Standalone nav** | Identity sidebar (Profile, Register, Reset password) when no `return_url` |
| **Core redirect nav** | WebOnOne sidebar only when valid `return_url` is present |
| **Main content area** | `#main-content` region inside `AppShell` |

## Success criteria

1. All in-scope WebOnOne pages use **`FeaturePage`** (directly or via `PageHeader` inside it).
2. Title typography is **`text-2xl font-semibold`**; description is **`text-sm text-muted-foreground`** with **`mt-1`** under title.
3. Feature pages use full width of shell main content (`w-full`) — no per-page `max-w-*` on wrappers.
4. Gap between header block and page body is **`gap-6`** (24px).
5. `feature-page-layout.mdc` documents required structure and lists reference implementations.
6. Identity dual nav modes per [04-identity-navigation.md](./04-identity-navigation.md) — mutually exclusive sidebars.
7. `npm run build -w @webonone/ui-kit` and `npm run type-check -w webonone-v2-root` pass.
8. `npm run type-check -w identity-root` passes.
