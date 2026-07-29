import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'
import {
  HOUR_HEIGHT_PX,
  WEEKDAY_LABELS,
  addDays,
  eventStyleInDay,
  eventsForDay,
  formatPeriodLabel,
  hourSlotRange,
  isToday,
  monthGridDays,
  shiftAnchor,
  startOfLocalDay,
  startOfWeek,
} from './fullCalendarUtils'

export type FullCalendarView = 'day' | 'week' | 'month'

/** Display-only; no CRUD in 1.15.0. `end` is exclusive. */
export type FullCalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
}

export interface FullCalendarProps {
  view: FullCalendarView
  onViewChange: (view: FullCalendarView) => void
  anchorDate: Date
  onAnchorDateChange: (date: Date) => void
  events?: FullCalendarEvent[]
  onSlotClick?: (range: { start: Date; end: Date }) => void
  onEventClick?: (event: FullCalendarEvent) => void
  showToolbar?: boolean
  className?: string
  id?: string
}

const VIEWS: FullCalendarView[] = ['day', 'week', 'month']

const VIEW_LABELS: Record<FullCalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MONTH_EVENT_LIMIT = 3

function EventChip({
  event,
  style,
  className,
  onEventClick,
}: {
  event: FullCalendarEvent
  style?: React.CSSProperties
  className?: string
  onEventClick?: (event: FullCalendarEvent) => void
}) {
  const interactive = Boolean(onEventClick)
  return (
    <button
      type="button"
      tabIndex={interactive ? 0 : -1}
      disabled={!interactive}
      onClick={(e) => {
        e.stopPropagation()
        onEventClick?.(event)
      }}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onEventClick?.(event)
        }
      }}
      className={cn(
        'absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md px-1 py-0.5 text-left text-xs text-foreground',
        !event.color && 'bg-primary/15',
        interactive && 'cursor-pointer hover:opacity-90',
        !interactive && 'cursor-default',
        className,
      )}
      style={style}
      title={event.title}
    >
      <span className="block truncate font-medium">{event.title}</span>
    </button>
  )
}

function TimelineColumn({
  day,
  events,
  onSlotClick,
  onEventClick,
  showGutter,
}: {
  day: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
  showGutter: boolean
}) {
  const dayEvents = eventsForDay(events, day)
  const interactiveSlots = Boolean(onSlotClick)

  return (
    <div className="relative flex min-w-0 flex-1">
      {showGutter ? (
        <div
          className="sticky left-0 z-20 w-14 shrink-0 border-r border-border bg-[hsl(var(--background-base))] text-right text-xs text-muted-foreground"
          style={{ height: HOURS.length * HOUR_HEIGHT_PX }}
        >
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="pr-2"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              <span className="-translate-y-1/2 inline-block">
                {`${String(hour).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div
        className="relative min-w-0 flex-1 border-r border-border last:border-r-0"
        style={{ height: HOURS.length * HOUR_HEIGHT_PX }}
      >
        {HOURS.map((hour) => {
          const range = hourSlotRange(day, hour)
          return (
            <div
              key={hour}
              role={interactiveSlots ? 'button' : undefined}
              tabIndex={interactiveSlots ? 0 : undefined}
              className={cn(
                'border-b border-border',
                interactiveSlots && 'cursor-pointer hover:bg-accent/40',
              )}
              style={{ height: HOUR_HEIGHT_PX }}
              onClick={() => onSlotClick?.(range)}
              onKeyDown={(e) => {
                if (!interactiveSlots) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSlotClick?.(range)
                }
              }}
              aria-label={
                interactiveSlots
                  ? `Slot ${range.start.toLocaleString()}`
                  : undefined
              }
            />
          )
        })}
        {dayEvents.map((event) => (
          <EventChip
            key={event.id}
            event={event}
            style={eventStyleInDay(event, day)}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  )
}

function DayView({
  anchorDate,
  events,
  onSlotClick,
  onEventClick,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
}) {
  const day = startOfLocalDay(anchorDate)
  return (
    <div className="overflow-auto">
      <div
        className={cn(
          'sticky top-0 z-30 border-b border-border bg-[hsl(var(--background-base))] px-3 py-2 text-sm font-medium',
          isToday(day) && 'bg-accent',
        )}
      >
        {day.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </div>
      <TimelineColumn
        day={day}
        events={events}
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
        showGutter
      />
    </div>
  )
}

function WeekView({
  anchorDate,
  events,
  onSlotClick,
  onEventClick,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
}) {
  const weekStart = startOfWeek(anchorDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="overflow-auto">
      <div className="sticky top-0 z-30 flex border-b border-border bg-[hsl(var(--background-base))]">
        <div className="w-14 shrink-0 border-r border-border" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'min-w-0 flex-1 border-r border-border px-1 py-2 text-center text-sm last:border-r-0',
              isToday(day) && 'bg-accent',
            )}
          >
            <div className="text-xs text-muted-foreground">
              {WEEKDAY_LABELS[day.getDay()]}
            </div>
            <div className="font-medium">{day.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="flex">
        <div
          className="sticky left-0 z-20 w-14 shrink-0 border-r border-border bg-[hsl(var(--background-base))] text-right text-xs text-muted-foreground"
          style={{ height: HOURS.length * HOUR_HEIGHT_PX }}
        >
          {HOURS.map((hour) => (
            <div key={hour} className="pr-2" style={{ height: HOUR_HEIGHT_PX }}>
              <span className="-translate-y-1/2 inline-block">
                {`${String(hour).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>
        {days.map((day) => (
          <TimelineColumn
            key={day.toISOString()}
            day={day}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
            showGutter={false}
          />
        ))}
      </div>
    </div>
  )
}

function MonthView({
  anchorDate,
  events,
  onSlotClick,
  onEventClick,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
}) {
  const days = monthGridDays(anchorDate)
  const month = anchorDate.getMonth()
  const interactive = Boolean(onSlotClick)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="border-r border-border py-2 last:border-r-0">
            {label}
          </div>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const inMonth = day.getMonth() === month
          const dayEvents = eventsForDay(events, day)
          const visible = dayEvents.slice(0, MONTH_EVENT_LIMIT)
          const overflow = dayEvents.length - visible.length
          const dayStart = startOfLocalDay(day)
          const dayEnd = addDays(dayStart, 1)

          return (
            <div
              key={day.toISOString()}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              className={cn(
                'min-h-0 overflow-hidden border-b border-r border-border p-1 last:border-r-0',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isToday(day) && 'bg-accent/40',
                interactive && 'cursor-pointer hover:bg-accent/40',
              )}
              onClick={() => onSlotClick?.({ start: dayStart, end: dayEnd })}
              onKeyDown={(e) => {
                if (!interactive) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSlotClick?.({ start: dayStart, end: dayEnd })
                }
              }}
            >
              <div
                className={cn(
                  'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-xs',
                  isToday(day) && 'bg-primary text-primary-foreground',
                  !inMonth && 'opacity-60',
                )}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    tabIndex={onEventClick ? 0 : -1}
                    disabled={!onEventClick}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    className={cn(
                      'truncate rounded-md px-1 py-0.5 text-left text-xs text-foreground',
                      !event.color && 'bg-primary/15',
                      onEventClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
                    )}
                    style={event.color ? { backgroundColor: event.color } : undefined}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
                {overflow > 0 ? (
                  <span className="px-1 text-xs text-muted-foreground">+{overflow} more</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FullCalendar({
  view,
  onViewChange,
  anchorDate,
  onAnchorDateChange,
  events = [],
  onSlotClick,
  onEventClick,
  showToolbar = true,
  className,
  id,
}: FullCalendarProps) {
  const label = formatPeriodLabel(anchorDate, view)

  return (
    <div
      id={id}
      className={cn(
        'flex min-h-[28rem] flex-1 flex-col rounded-md border border-border bg-[hsl(var(--background-base))]',
        className,
      )}
    >
      {showToolbar ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-[hsl(var(--background-base))] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAnchorDateChange(startOfLocalDay(new Date()))}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous period"
              onClick={() => onAnchorDateChange(shiftAnchor(anchorDate, view, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Next period"
              onClick={() => onAnchorDateChange(shiftAnchor(anchorDate, view, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium" aria-live="polite">
              {label}
            </span>
          </div>
          <div
            role="group"
            aria-label="Calendar view"
            className="flex items-center gap-1"
          >
            {VIEWS.map((v) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={view === v ? 'default' : 'outline'}
                aria-pressed={view === v}
                onClick={() => onViewChange(v)}
              >
                {VIEW_LABELS[v]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          'min-h-0 flex-1',
          view === 'month' ? 'flex flex-col' : 'overflow-auto',
        )}
      >
        {view === 'day' ? (
          <DayView
            anchorDate={anchorDate}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
        ) : null}
        {view === 'week' ? (
          <WeekView
            anchorDate={anchorDate}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
        ) : null}
        {view === 'month' ? (
          <MonthView
            anchorDate={anchorDate}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
          />
        ) : null}
      </div>
    </div>
  )
}

export { FullCalendar }
