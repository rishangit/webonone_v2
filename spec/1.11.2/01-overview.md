# 01 — Overview (1.11.2)

## Vision

Platform admin users move between **WebOnOne (core)**, **Data**, and **Email** using a shared left navigation. Cross-origin hops must use the **auth-code handoff** pattern from [platform-shell-navigation.mdc](../../.cursor/rules/platform-shell-navigation.mdc) — the same flow WebOnOne already uses for Email and Data.

After 1.11.0 (Data) and 1.9.0 (Email), satellites show core nav in platform mode but **peer service items** (Data while on Email, Email while on Data) are not wired with outbound redirect handlers. Nav URLs fall back to the **core origin** plus internal sentinel paths (e.g. `/email/templates`), which WebOnOne does not route — the browser ends up on core **Home**.

## User story

As a platform admin on the Data service, when I click **Email → Templates** in the left nav, I want to land on the Email templates page — not the WebOnOne home page.

## Goals (1.11.2)

1. **Data → Email** — all Email nav sentinels (`/email/history`, `/email/templates`) trigger auth-code redirect to Email with the correct path.
2. **Email → Data** — all Data nav sentinels (`/data/dashboard`, `/data/tags`) trigger auth-code redirect to Data with the correct path.
3. **Preserve platform context** — pass `return_url`, `core_nav`, and theme query params on every cross-satellite hop (mirror WebOnOne outbound).
4. **No core regression** — WebOnOne → Data/Email and satellite → Profile flows unchanged.

## Root cause (summary)

`resolvePlatformNavUrls` in `@webonone/platform-nav` resolves external service hrefs only when the caller supplies that service's origin in `externalOrigins`. Satellite `buildCoreNav` passes only **self**:

- Data: `{ data: dataOrigin }` — Email items resolve to `{coreOrigin}/email/templates`
- Email: `{ email: emailOrigin }` — Data items resolve to `{coreOrigin}/data/tags`

`withClientSideNavigation` then treats non-local paths as full-page navigation to core — wrong destination.

WebOnOne avoids this with `withExternalNavActions` + `getEmailRedirectOptions` / `getDataRedirectOptions` intercepting sentinel paths before navigation.

## Scope (1.11.2)

### In scope

- `data/frontend`: `redirectToEmail.ts`, `emailConfig.ts` (peer origin from env), `AppLayout` external nav handlers
- `email/frontend`: `redirectToData.ts`, `dataConfig.ts`, `AppLayout` external nav handlers
- Optional refactor: shared helper in `packages/platform-nav` for attaching sentinel `onClick` handlers
- Manual acceptance: Data ↔ Email nav in platform mode

### Out of scope

- New nav items or role-based visibility changes
- Backend API changes
- Identity auth-code contract changes (reuse existing `/auth/code` + exchange)
- WebOnOne core nav changes (already correct)

## Glossary

| Term | Definition |
|------|------------|
| **Sentinel path** | Internal nav `to` value not routed on current origin (e.g. `/email/templates` on Data origin) |
| **Platform mode** | Satellite opened with validated `return_url` — shows core-branded `AppShell` |
| **Peer hop** | Navigation from one satellite FE to another (Data ↔ Email) |

## Success criteria

1. From Data `/tags`, click Email → Templates → lands on `{emailOrigin}/templates?return_url=…&core_nav=…` (after code exchange).
2. From Email `/templates`, click Data → Tags → lands on `{dataOrigin}/tags?return_url=…&core_nav=…`.
3. From Data, click Email → History → lands on Email `/history`.
4. From Email, click Data → Data Catalog → lands on Data `/`.
5. Core Home and Settings links from either satellite still navigate to WebOnOne correctly.
6. `npm run type-check -w data-root` and `npm run type-check -w email-root` pass.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Bug fixing | 86ey5wdua | All docs |
| Subtask — navigation with service | 86ey5we2u | [02-cross-service-nav-fix.md](./02-cross-service-nav-fix.md) |

### Source requirements (from ClickUp subtask)

> In core project when user is in Data → Tags and clicks Email → Template in left navigation, user is not redirected to Email → Template — it redirects to the core home page. Every time the user tries to move through the two services it moves to the home page.
