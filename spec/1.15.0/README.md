# WebOnOne Platform — Specification (1.15.0)

After **company admin** login, the WebOnOne shell left navigation includes a **Calendar** item. Opening it shows a **full calendar** page with **Day**, **Week**, and **Month** views — built from shared `@webonone/ui-kit` primitives (not a one-off page layout).

**Spec No:** 1.15.0

Implementation branch: **`spec/1.15.0`**

## What changed from current platform

| Area | Before (current) | 1.15.0 |
|------|------------------|--------|
| Company admin left nav | Home, Identity, Data, Email, SMS, Settings — **no Calendar** | **Calendar** item on `main` (company_admin) nav |
| Calendar UI | UI Kit `Calendar` = compact month grid for **DatePicker** only | New **`FullCalendar`** board: day / week / month + toolbar |
| Calendar route | None | WebOnOne **`/calendar`** `FeaturePage` for `company_admin` |
| Events / appointments API | N/A | **Out of scope** — empty board + showcase demo data only |

## Projects affected

| Project | Role in 1.15.0 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | `FullCalendar` (+ view types, toolbar); showcase demo; keep existing `Calendar` / `DatePicker` unchanged |
| **platform-nav** (`packages/platform-nav/`) | Add Calendar leaf to `MAIN_PLATFORM_NAV` |
| **WebOnOne v2** (`webonone-v2/`) | Route, page, role guard, Lucide `Calendar` icon wiring |
| **Identity / Media / Email / Data / SMS** | No change |
| **Backend / migrations** | No calendar events schema in this release |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-ui-kit-full-calendar.md](./02-ui-kit-full-calendar.md) | `FullCalendar` API, day/week/month behavior, tokens |
| [03-showcase-full-calendar.md](./03-showcase-full-calendar.md) | UI Kit showcase demo |
| [04-company-admin-calendar-nav.md](./04-company-admin-calendar-nav.md) | platform-nav + WebOnOne nav icon / role |
| [05-calendar-page.md](./05-calendar-page.md) | `/calendar` FeaturePage + views wiring |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.15.0 Company admin calendar navigation + full calendar views | TBD | All docs |
| Subtask: UI Kit FullCalendar (day / week / month) | TBD | [02](./02-ui-kit-full-calendar.md), [03](./03-showcase-full-calendar.md) |
| Subtask: Calendar nav for company admin | TBD | [04](./04-company-admin-calendar-nav.md) |
| Subtask: WebOnOne calendar page | TBD | [05](./05-calendar-page.md) |

## Revision history

- **2026-07-28** — Initial spec: company_admin Calendar nav; full calendar page with Day / Week / Month views via UI Kit `FullCalendar`; events CRUD deferred.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.3.0/03-form-controls.md](../1.3.0/03-form-controls.md) | Existing compact `Calendar` + `DatePicker` (do not break) |
| [../1.2.0/01-overview.md](../1.2.0/01-overview.md) | App shell + left navigation |
| [../1.9.4/03-nav-and-permissions.md](../1.9.4/03-nav-and-permissions.md) | Session role → nav variant |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | `FeaturePage` for route pages |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| UI Kit package | `.cursor/skills/ui-kit-agent/SKILL.md` · `.cursor/rules/ui-kit-project.mdc` |
| Consumer UI | `.cursor/rules/ui-kit-consumption.mdc` — no hand-rolled calendar board in WebOnOne |
| Feature pages | `.cursor/rules/feature-page-layout.mdc` |
| WebOnOne scope | `.cursor/skills/webonone-agent/SKILL.md` · `.cursor/rules/webonone-v2-project.mdc` |
| Shell / nav | `.cursor/rules/platform-shell-navigation.mdc` |
| Loading overlay | `.cursor/rules/loading-empty-states.mdc` |
| Code cleanliness | `.cursor/rules/code-cleanliness.mdc` |
| Microservice boundaries | `.cursor/rules/microservice-architecture.mdc` — calendar stays in WebOnOne core (not a new service) |
| Orchestration | `.cursor/skills/platform-orchestrator/SKILL.md` — UI Kit then WebOnOne (+ platform-nav) |

## Local dev

```bash
npm run build:platform-nav   # after nav def change
npm run build -w @webonone/ui-kit
npm run dev:ui-kit           # Showcase — FullCalendar demo
npm run dev:webonone         # /calendar as company_admin
npm run dev:identity         # login + role selection
```

Manual test: Log in → choose **company admin** → left nav **Calendar** → page shows full calendar → switch **Day** / **Week** / **Month** → prev / next / Today update the visible range. Confirm `member` and `super_admin` do **not** see Calendar in this release (unless a later revision expands roles).
