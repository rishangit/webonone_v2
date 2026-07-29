# WebOnOne Platform — Specification (1.15.1)

Extends [1.15.0](../1.15.0/README.md) Calendar board with a **Calendar** nav group (**Schedule** + **Events**), Events list, and **Add event** wizard (branching on service `timeMode`), staff-working-day dates, Identity attendee for duration services, and weekly recurrence.

**Spec No:** 1.15.1

Implementation branch: **`spec/1.15.1`** (or continue on `spec/1.15.0`)

## What changed from 1.15.0

| Area | 1.15.0 | 1.15.1 |
|------|--------|--------|
| Nav | Flat **Calendar** item | Group **Calendar** → **Schedule**, **Events** |
| Schedule | Empty `FullCalendar` | Loads expanded occurrences for visible range |
| Events | None | List + Add event wizard + `company_events` API |

## Wizard branching

| Service `timeMode` | Steps |
|--------------------|-------|
| `window` (Specific time) | Service → Staff → When → Summary |
| `duration` | Service → Staff → Attendee (Identity user) → When → Summary |

**When:** start date must be a staff working weekday; duration also picks start time within staff hours; window uses service start/end. Recurrence: `none` \| `weekly` with optional until date.

## Projects

| Project | Role |
|---------|------|
| platform-nav | Calendar group defs |
| WebOnOne BE | `company_events` migration + CRUD + range expand |
| WebOnOne FE | Schedule feed, EventsPage, EventFormDialog |

## Success criteria

1. company_admin sees Calendar → Schedule / Events
2. Add event wizard follows window vs duration steps
3. Invalid staff non-working dates rejected
4. Weekly series appears on Schedule for the selected weekday until end date
5. `npm run type-check -w webonone-v2-root` passes
