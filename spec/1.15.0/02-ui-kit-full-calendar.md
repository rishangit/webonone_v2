# 02 — UI Kit FullCalendar (day / week / month)

ClickUp: TBD

## Problem

The existing `Calendar` component is a **compact month grid** for `DatePicker`. Company admins need a **full scheduling board** with **Day**, **Week**, and **Month** layouts. That board must live in `@webonone/ui-kit` so WebOnOne (and future consumers) do not hand-roll grids — [ui-kit-consumption.mdc](../../.cursor/rules/ui-kit-consumption.mdc).

## Naming

| Export | Role |
|--------|------|
| `Calendar` | **Unchanged** — DatePicker month grid |
| `FullCalendar` | **New** — full-page / feature board with views |
| `FullCalendarView` | Type: `'day' \| 'week' \| 'month'` |
| `FullCalendarEvent` | Optional display-only slot shape (showcase / future API) |

Do **not** overload `Calendar` props with view modes — keep DatePicker stable.

## Component API

```typescript
export type FullCalendarView = 'day' | 'week' | 'month'

/** Display-only; no CRUD in 1.15.0 */
export type FullCalendarEvent = {
  id: string
  title: string
  /** Inclusive start (local Date) */
  start: Date
  /** Exclusive or inclusive end — document as exclusive end for duration math */
  end: Date
  /** Optional accent; default primary/muted chip */
  color?: string
}

export interface FullCalendarProps {
  /** Controlled visible view */
  view: FullCalendarView
  onViewChange: (view: FullCalendarView) => void
  /** Anchor date for the visible period */
  anchorDate: Date
  onAnchorDateChange: (date: Date) => void
  /** Optional events to paint (empty = empty board) */
  events?: FullCalendarEvent[]
  /** Called when user activates an empty slot or day cell (future create) */
  onSlotClick?: (range: { start: Date; end: Date }) => void
  /** Called when user activates an event chip (future detail) */
  onEventClick?: (event: FullCalendarEvent) => void
  /** Show toolbar (view switcher + period nav); default true */
  showToolbar?: boolean
  className?: string
  id?: string
}
```

Export `FullCalendar`, `FullCalendarProps`, `FullCalendarView`, `FullCalendarEvent` from `ui-kit/package/src/index.ts`.

## Toolbar

Render above the board when `showToolbar !== false`:

| Control | Behavior |
|---------|----------|
| **Today** | `onAnchorDateChange(startOfLocalDay(now))` |
| **Previous** | Shift anchor by −1 day / −1 week / −1 month per `view` |
| **Next** | Shift anchor by +1 day / +1 week / +1 month per `view` |
| **Period label** | Human range: e.g. `July 28, 2026` (day); `Jul 27 – Aug 2, 2026` (week); `July 2026` (month) |
| **View switcher** | Segmented control of three `Button`s: **Day** · **Week** · **Month**; active = `variant="default"`, inactive = `variant="outline"` (size `sm`) |

Use Lucide `ChevronLeft` / `ChevronRight` on period buttons (`aria-label` required). No new icon package.

**Do not** introduce a separate Tabs package dependency — use existing `Button` group in a `role="group"` / `aria-label="Calendar view"` container.

## View layouts

### Day

- Single column timeline for the anchor date.
- Hours **00:00–23:00** (or 06:00–22:00 with scroll — **default: 00–23**, scrollable body).
- Horizontal hour gutter + event columns.
- Empty slots remain clickable if `onSlotClick` provided (30- or 60-minute steps — **default 60 min**).

### Week

- Seven columns: week containing `anchorDate` (week starts **Sunday** to match compact `Calendar` header `Su…Sa`; document if product later wants Monday-start).
- Shared hour gutter; each day column mirrors day view height.
- Sticky day headers with weekday + date number; highlight **today**.

### Month

- Classic 7×N month grid (leading/trailing days from adjacent months, muted).
- Cell shows day number; up to **N** event chips then `+k more` overflow (N = **3** default).
- Selecting a day cell: if `onSlotClick`, pass that day’s local start/end; do **not** auto-switch to day view unless consumer handles it.

## Events rendering (display-only)

- Position by `start`/`end` within the visible range; clip overflow at range edges.
- Month: list chips by start time ascending.
- No drag, resize, or context menus in 1.15.0.
- When `events` omitted or `[]`, board still shows structure (empty state is the grid itself — no separate `ItemListEmpty` required).

## Styling / tokens

| Surface | Tokens |
|---------|--------|
| Board chrome | `border-border`, `bg-background`, `rounded-md` |
| Header / gutter text | `text-muted-foreground`, `text-sm` |
| Today highlight | `bg-accent` or ring on day number / column header |
| Hour lines | `border-border` hairlines |
| Event chip | `bg-primary/15 text-foreground` (or `color` when provided); `rounded-md`, `text-xs`, truncate title |
| Hover empty slot | `hover:bg-accent/40` |

Follow [tailwind-css.mdc](../../.cursor/rules/tailwind-css.mdc) — theme CSS variables only; no hard-coded brand purples.

## Accessibility

- Toolbar buttons have accessible names.
- View switcher: `aria-pressed` on active view button.
- Grid / timeline: keyboard focus on day cells and event chips when interactive (`tabIndex={0}` + Enter/Space when handlers set).
- Period label exposed as live text (`aria-live="polite"` optional on label change).

## Forbidden

- Importing FullCalendar.js / react-big-calendar / MUI X Date Calendar
- Breaking changes to existing `Calendar` / `DatePicker`
- Business logic (company_id, auth) inside the kit component
- Persisting view preference inside the kit (consumer owns state)

## Verification

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

Skill: [.cursor/skills/ui-kit-agent/SKILL.md](../../.cursor/skills/ui-kit-agent/SKILL.md)
