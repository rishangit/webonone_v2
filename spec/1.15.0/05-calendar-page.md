# 05 — WebOnOne Calendar page

ClickUp: TBD

## Goal

Company admins open **`/calendar`** and see a **full calendar** with Day / Week / Month views using UI Kit `FullCalendar` inside `FeaturePage`.

## Route

| Item | Detail |
|------|--------|
| Path | `/calendar` |
| Layout | Standard AppShell `Outlet` (same as Home / Settings) |
| Lazy | Prefer existing `LazyRoute` pattern |
| Guard | Allow only when `activeRole === 'company_admin'`; otherwise redirect to `/` (or existing unauthorized pattern used by Staff / company catalog) |

Reference guards: `StaffDetailsPage` / `CompanyCatalogListPage` role checks.

## Page composition

Follow [feature-page-layout.mdc](../../.cursor/rules/feature-page-layout.mdc):

```text
FeaturePage
  title: Calendar
  description: short — e.g. “View your company schedule by day, week, or month.”
  body:
    FullCalendar
      view + onViewChange
      anchorDate + onAnchorDateChange
      events={[]}          // 1.15.0 — empty until events API
      showToolbar
```

| Rule | Detail |
|------|--------|
| Width | Full main content — no `max-w-*` wrapper |
| Padding | No extra `px-*` on `FeaturePage` |
| Loading | No fetch in 1.15.0 — do not show overlay for empty static board |
| UI | **Only** `@webonone/ui-kit` interactive controls — no local grid |

### State

Page owns React state (or a tiny feature slice if the team prefers Redux for consistency — **default: local `useState`** is enough with no API):

```ts
const [view, setView] = useState<FullCalendarView>('month')
const [anchorDate, setAnchorDate] = useState(() => new Date())
```

Optional URL sync (`?view=week`) is **nice-to-have**, not required for 1.15.0.

### Events

`events={[]}` (or omit). Do **not** invent a WebOnOne backend table in this release. Slot/event click handlers may be no-ops or omitted.

## Feature module layout

Suggested paths (match existing feature folders):

```text
webonone-v2/frontend/src/features/calendar/
  pages/CalendarPage.tsx
```

Register in the app router next to other core routes. Export nothing into peer services.

## Env

No new `VITE_*` keys.

## Forbidden

- Re-implementing day/week/month grids in WebOnOne
- Opening calendar in a dialog instead of a route
- Embedding Identity/Media for the board
- Adding calendar to member/super_admin without a spec revision

## Verification

```bash
npm run type-check -w webonone-v2-root
```

Manual: company_admin → Calendar nav → `/calendar` → switch Day / Week / Month → Today / prev / next. As member or super_admin: no nav item; `/calendar` redirects away.

Skill: [.cursor/skills/webonone-agent/SKILL.md](../../.cursor/skills/webonone-agent/SKILL.md)
