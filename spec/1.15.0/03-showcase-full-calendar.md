# 03 — Showcase FullCalendar demo

ClickUp: TBD

## Goal

Engineers and designers can exercise **Day / Week / Month** in the UI Kit showcase without running WebOnOne.

## Placement

| Option | Prefer |
|--------|--------|
| **Components** tab section **Full calendar** | **Default** — next to DatePicker / compact Calendar demos |
| Pages tab | Only if Components is overcrowded; then a small `FullCalendarPageDemo` |

Follow existing showcase patterns in `ui-kit/showcase` (section heading + short description + live controls).

## Demo requirements

1. Controlled `view` state with the kit toolbar (or mirrored external buttons — prefer **built-in toolbar**).
2. Controlled `anchorDate` starting at **today**.
3. **Sample events** (3–6) spanning day / multi-hour / multi-day so month overflow and week placement are visible.
4. Optional console or toast-less `onSlotClick` / `onEventClick` via showcase `Callout` or muted status text (“Selected: …”) — do not add toast dependency for the demo.
5. Note in copy: *Compact `Calendar` remains for DatePicker; this board is for full-page scheduling.*

## Non-goals

- Wiring real WebOnOne APIs
- Persisting demo state across reloads

## Verification

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run dev -w ui-kit-root   # manual: open Components → Full calendar
```
