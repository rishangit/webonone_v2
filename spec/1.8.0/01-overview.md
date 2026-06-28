# 01 — Overview (1.8.0)

## Vision

Every authenticated **feature page** rendered inside `AppShell`'s main content area shares the same visual structure: a **title header** at the top, a **centered content column** with a fixed maximum width, and **consistent vertical spacing** between the header and page body.

## User story

As a user, I want all feature pages to have a consistent structure within the main content area, so that each page is easy to navigate and visually uniform.

## Goals

1. Export **`PageHeader`** and **`FeaturePage`** from `@webonone/ui-kit`.
2. **`PageHeader`** — title (`h1`), optional description, optional trailing actions slot.
3. **`FeaturePage`** — wraps page body in `mx-auto w-full max-w-4xl` with **`gap-6`** between header and children.
4. Refactor WebOnOne v2 feature pages that render inside `AppShell` to use the shared layout.
5. Add **`feature-page-layout.mdc`** so agents and developers apply the same pattern on new pages.
6. Showcase demo documenting the layout contract.

## In scope

| Item | Detail |
|------|--------|
| `PageHeader` | `ui-kit/package/src/layouts/PageHeader.tsx` |
| `FeaturePage` | `ui-kit/package/src/layouts/FeaturePage.tsx` |
| Public export | `ui-kit/package/src/index.ts` |
| Showcase demo | Layout section on Components or dedicated showcase page |
| WebOnOne refactor | `HomePage`, `BasicSettingsPage`, `CompaniesPage`, `SystemThemePage` |
| Cursor rule | `.cursor/rules/feature-page-layout.mdc` + index in `.cursor/rules/README.md` |

## Out of scope

| Item | Reason |
|------|--------|
| `AppShell` / sidebar changes | Shell chrome unchanged ([1.2.0](../1.2.0/03-app-shell-navigation.md)) |
| Auth / embed layouts | `AuthLayout`, `PageShell`, Media `EmbedLayout` keep their own patterns |
| Identity profile page | Centered card layout is intentional for `/profile` |
| Media iframe embed pages | Chromeless embed routes excluded |
| Backend API changes | Frontend-only layout spec |

## Glossary

| Term | Meaning |
|------|---------|
| **Feature page** | Route-level page inside `AppShell` `<Outlet />` (not auth, not iframe embed) |
| **PageHeader** | Title block: `h1` + optional description + optional actions |
| **FeaturePage** | Outer wrapper enforcing max width, centering, and header-to-body gap |
| **Main content area** | `#main-content` region inside `AppShell` |

## Success criteria

1. All in-scope WebOnOne pages use **`FeaturePage`** (directly or via `PageHeader` inside it).
2. Title typography is **`text-2xl font-semibold`**; description is **`text-sm text-muted-foreground`** with **`mt-1`** under title.
3. Content column is **`mx-auto w-full max-w-4xl`** by default.
4. Gap between header block and page body is **`gap-6`** (24px).
5. `feature-page-layout.mdc` documents required structure and lists reference implementations.
6. `npm run build -w @webonone/ui-kit` and `npm run type-check -w webonone-v2-root` pass.
