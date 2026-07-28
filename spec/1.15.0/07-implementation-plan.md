# 07 — Implementation Plan

Phased delivery for **1.15.0** on branch **`spec/1.15.0`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b spec/1.15.0
```

| Rule | Detail |
|------|--------|
| Base | WebOnOne shell + session roles; UI Kit `Calendar` / `DatePicker` on master |
| Spec branch | `spec/1.15.0` |
| Order | **UI Kit → platform-nav → WebOnOne** (orchestrator: ui-kit-agent then webonone-agent; platform-nav may be parent or with WebOnOne) |
| Backend | No migrations |
| Peers | Identity / Data / Email / Media / SMS unchanged |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.15.0/*` documentation
- [ ] Branch `spec/1.15.0`
- [ ] ClickUp parent + subtasks (IDs TBD)

---

## Phase 1 — UI Kit FullCalendar

**Goal:** [02](./02-ui-kit-full-calendar.md)

| Task | Detail |
|------|--------|
| Implement | `FullCalendar` with toolbar + day / week / month layouts |
| Export | `index.ts` types + component |
| Preserve | Existing `Calendar` / `DatePicker` behavior |

**Exit criteria:** Showcase can mount board; view + period controls work with sample events.

**Verify:** `npm run build -w @webonone/ui-kit` · `npm run type-check -w ui-kit-root`

**Agent / skill:** ui-kit-agent · `.cursor/skills/ui-kit-agent/SKILL.md`

---

## Phase 2 — Showcase demo

**Goal:** [03](./03-showcase-full-calendar.md)

| Task | Detail |
|------|--------|
| Components section | Full calendar demo + sample events + short docs copy |

**Verify:** `npm run type-check -w ui-kit-root` · manual `npm run dev:ui-kit`

---

## Phase 3 — platform-nav Calendar item

**Goal:** [04](./04-company-admin-calendar-nav.md)

| Task | Detail |
|------|--------|
| `MAIN_PLATFORM_NAV` | `{ path: '/calendar', label: 'Calendar' }` after Home |
| Tests | `coreNav.test.ts` asserts main has Calendar; member/SA do not |

**Verify:** `npm run build:platform-nav`

---

## Phase 4 — WebOnOne Calendar page + nav icon

**Goal:** [04](./04-company-admin-calendar-nav.md), [05](./05-calendar-page.md)

| Task | Detail |
|------|--------|
| Icon map | Lucide `Calendar` → `/calendar` |
| Page | `features/calendar/pages/CalendarPage.tsx` + `FeaturePage` + `FullCalendar` |
| Router | `/calendar` + `company_admin` guard |
| Chain | Ensure `build` still builds ui-kit + platform-nav before FE |

**Exit criteria:** company_admin can open full calendar and switch views.

**Verify:** `npm run type-check -w webonone-v2-root`

**Agent / skill:** webonone-agent · `.cursor/skills/webonone-agent/SKILL.md`  
**Rules:** feature-page-layout, ui-kit-consumption, webonone-v2-project, loading-empty-states, code-cleanliness

---

## Phase 5 — Manual QA + cleanup

| Check | Expected |
|-------|----------|
| Login as company_admin | Calendar in left nav |
| Click Calendar | `/calendar`, full board |
| Day / Week / Month | Layouts switch; label updates |
| Today / prev / next | Period moves correctly |
| DatePicker elsewhere | Still works (compact Calendar) |
| member / super_admin | No Calendar nav; `/calendar` blocked |
| Unused code | Clean imports / no empty folders |

---

## Acceptance checklist (release)

- [ ] `FullCalendar` exported from `@webonone/ui-kit` with day / week / month
- [ ] Showcase demo present
- [ ] `MAIN_PLATFORM_NAV` includes Calendar; other variants do not
- [ ] WebOnOne `/calendar` FeaturePage for company_admin
- [ ] No third-party calendar library
- [ ] No events backend / migration
- [ ] Compact `Calendar` / `DatePicker` unchanged
- [ ] `npm run build -w @webonone/ui-kit` passes
- [ ] `npm run type-check -w ui-kit-root` passes
- [ ] `npm run type-check -w webonone-v2-root` passes

---

## Forbidden

- Hand-rolled calendar grids in `webonone-v2/`
- Shared DB or new calendar microservice
- Spec links from `.cursor/rules/` to this folder (rules stay self-contained)
- Breaking DatePicker month grid API
- Calendar nav for roles outside company_admin without a revision

---

## Suggested follow-ups (not 1.15.0)

- Company calendar events API + Redux/`store-kit` feature store
- Create/edit event dialog (core-hosted if ever embedded)
- super_admin / member visibility
- URL `?view=` persistence
- Monday-start week option
