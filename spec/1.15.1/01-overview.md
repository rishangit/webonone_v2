# 01 — Overview (1.15.1)

## Goals

1. **Nav** — Calendar group with Schedule (`/calendar/schedule`) and Events (`/calendar/events`).
2. **Events list** — Search, paginate, Add event, remove.
3. **Add event wizard** — Branch on company service `timeMode` (`window` \| `duration`).
4. **When** — Select one or more of the staff member’s **working weekdays** (not a single occurrence date), plus **From** and **Until** dates. Occurrences fire on every selected weekday in that inclusive range. Persist `weekdays` on `company_events`.
5. **Schedule paint** — Expand series into FullCalendar for the visible range (any day whose weekday is in `weekdays`).

## Out of scope

- Edit wizard, complex RRULE, staff↔service eligibility, member/super_admin access.
