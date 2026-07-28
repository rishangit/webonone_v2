# 01 — Overview (1.15.0)

## Vision

A **company admin** signed into WebOnOne can open **Calendar** from the left navigation and work with a **full calendar** that feels native to the product shell — clear **Day**, **Week**, and **Month** views, shared UI Kit chrome, and room to grow into scheduled events later without rebuilding the board.

## User stories

1. As a **company admin**, after login (and role selection when needed), I see **Calendar** in the left navigation alongside Home and other company tools.
2. As a company admin, I click **Calendar** and land on a full-width calendar page (not a DatePicker popover).
3. As a company admin, I switch among **Day**, **Week**, and **Month** views without leaving the page.
4. As a company admin, I move to the previous / next period and jump to **Today** so the board stays oriented.
5. As a designer / engineer, I preview the same board in the **UI Kit showcase** so consumers stay on kit primitives.

## Goals (1.15.0)

1. **Nav** — Add **Calendar** to company_admin (`main`) platform nav via `@webonone/platform-nav`.
2. **UI Kit FullCalendar** — Reusable board with `view: 'day' | 'week' | 'month'`, period navigation, and theme tokens — distinct from compact `Calendar` used by `DatePicker`.
3. **WebOnOne page** — Route `/calendar` wrapped in `FeaturePage`; gated to `company_admin`.
4. **Showcase** — Components (or Pages) demo exercising all three views.
5. **No events backend** — Empty / placeholder slots only; create/edit events deferred.

## Scope (1.15.0)

### In scope

- `ui-kit/package`: `FullCalendar` (+ types), export from `index.ts`
- `ui-kit/showcase`: demo with view switcher + sample range
- `packages/platform-nav`: Calendar item on `MAIN_PLATFORM_NAV` (`path: '/calendar'`)
- `webonone-v2/frontend`: route, `CalendarPage`, nav icon map, role guard
- Docs: this folder + `plan.mdc`

### Out of scope

- Calendar **events** CRUD, recurrence, attendees, reminders
- New microservice or shared calendar database
- Drag-and-drop reschedule
- Timezone picker / multi-calendar overlays
- Showing Calendar to `member` or `super_admin` (defer unless product revises)
- Changing Identity login / JWT / postMessage contracts
- Replacing or breaking existing `Calendar` / `DatePicker` APIs
- Third-party calendar libraries (FullCalendar.js, react-big-calendar, etc.) — use UI Kit only

## Glossary

| Term | Definition |
|------|------------|
| **Compact Calendar** | Existing `@webonone/ui-kit` `Calendar` — small month grid for date picking |
| **FullCalendar** | New kit board for day / week / month scheduling UI |
| **Calendar page** | WebOnOne route `/calendar` hosting `FullCalendar` inside `FeaturePage` |
| **View** | One of `day`, `week`, `month` |
| **Anchor date** | The date that defines the visible period (day of focus; week containing it; month containing it) |
| **Company admin** | Session role `company_admin` → platform nav variant `main` |

## Permission matrix

| Action | `member` | `company_admin` | `super_admin` |
|--------|----------|-----------------|---------------|
| See Calendar in left nav | no | **yes** | no (1.15.0) |
| Open `/calendar` | 403 / redirect home | **yes** | 403 / redirect home |
| Switch day / week / month | — | yes | — |
| Create / edit events | — | deferred | — |

## Success criteria

1. Company admin left nav shows **Calendar** (Lucide `Calendar` icon).
2. Clicking Calendar navigates to `/calendar` without full-page peer redirect (core-owned route).
3. Page shows a full calendar board with **Day**, **Week**, and **Month** controls.
4. Prev / next / Today update the visible range correctly for each view.
5. Compact `DatePicker` / `Calendar` still work unchanged.
6. Showcase demo covers all three views.
7. `member` / `super_admin` do not see the nav item; direct `/calendar` is blocked.
8. `npm run build -w @webonone/ui-kit`, `npm run type-check -w ui-kit-root`, and `npm run type-check -w webonone-v2-root` pass.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.15.0 | TBD | All docs |
| UI Kit FullCalendar | TBD | [02](./02-ui-kit-full-calendar.md) |
| Showcase | TBD | [03](./03-showcase-full-calendar.md) |
| Company admin nav | TBD | [04](./04-company-admin-calendar-nav.md) |
| Calendar page | TBD | [05](./05-calendar-page.md) |
