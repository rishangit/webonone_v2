import * as React from 'react'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { interactiveHoverClassName } from '../lib/selectionStyles'
import { shapePanelBorderedClassName } from '../lib/shape'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { ImagePreview } from './ImagePreview'
import { ListFilterPanel } from './ListFilterPanel'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { SegmentedSwitch, SegmentedSwitchItem } from './SegmentedSwitch'
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
import { formatPickerDate, formatPickerDateTime } from '../lib/displayDateFormat'

export type FullCalendarView = 'day' | 'week' | 'month'

/** Display-only; no CRUD in 1.15.0. `end` is exclusive. */
export type FullCalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  /** Small service thumbnail on the event chip. */
  imageUrl?: string | null
  /** Short line under the title (week/day). */
  subtitle?: string
  /** When set, show an Info icon; click opens a popover with this copy. */
  issueDetail?: string
}

export type FullCalendarEventPopoverCtx = {
  close: () => void
  /** `panel` on small screens (right slide-over); `popover` on md+ anchored to the event chip. */
  presentation: 'popover' | 'panel'
}

export interface FullCalendarProps {
  view: FullCalendarView
  onViewChange: (view: FullCalendarView) => void
  anchorDate: Date
  onAnchorDateChange: (date: Date) => void
  events?: FullCalendarEvent[]
  onSlotClick?: (range: { start: Date; end: Date }) => void
  onEventClick?: (event: FullCalendarEvent) => void
  /** When set, clicking an event opens a popover anchored to the chip (md+) or a right panel (< md). */
  renderEventPopover?: (
    event: FullCalendarEvent,
    ctx: FullCalendarEventPopoverCtx,
  ) => React.ReactNode
  /** Panel title on small screens; defaults to the event title. */
  renderEventDetailPanelTitle?: (event: FullCalendarEvent) => string
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
const CALENDAR_EVENT_THUMB_CLASS = 'h-4 w-4 shrink-0 rounded-sm'
const CALENDAR_EVENT_TIMELINE_THUMB_CLASS = 'h-5 w-5 shrink-0 rounded-sm'

function CalendarEventThumb({
  event,
  className,
}: {
  event: FullCalendarEvent
  className?: string
}) {
  if (!event.imageUrl) return null
  return (
    <ImagePreview
      src={event.imageUrl}
      alt={event.title}
      mode="view"
      className={cn(CALENDAR_EVENT_THUMB_CLASS, className)}
    />
  )
}

function TodayButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Today
    </Button>
  )
}

function PeriodNav({
  label,
  onPrev,
  onNext,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between md:col-start-2 md:row-start-1 md:justify-center md:gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="Previous period"
        onClick={onPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-2 text-center text-sm font-medium" aria-live="polite">
        {label}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="Next period"
        onClick={onNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function ViewSwitcher({
  view,
  onViewChange,
}: {
  view: FullCalendarView
  onViewChange: (view: FullCalendarView) => void
}) {
  return (
    <SegmentedSwitch
      value={view}
      onValueChange={(next) => onViewChange(next as FullCalendarView)}
      aria-label="Calendar view"
      size="sm"
    >
      {VIEWS.map((v) => (
        <SegmentedSwitchItem key={v} value={v}>
          {VIEW_LABELS[v]}
        </SegmentedSwitchItem>
      ))}
    </SegmentedSwitch>
  )
}

function eventChipToneClass(event: FullCalendarEvent): string | undefined {
  if (event.color) return undefined
  return event.issueDetail ? 'bg-destructive/15' : 'bg-primary/15'
}

const POPOVER_POINTER_EDGE_PADDING_PX = 14
const POPOVER_EST_WIDTH_PX = 352
const POPOVER_SIDE_OFFSET_PX = 10
const POPOVER_COLLISION_PADDING_PX = 12

type EventPopoverSide = 'right' | 'left'

function pickEventPopoverSide(trigger: HTMLElement): EventPopoverSide {
  const rect = trigger.getBoundingClientRect()
  const pad = POPOVER_COLLISION_PADDING_PX
  const offset = POPOVER_SIDE_OFFSET_PX
  const needW = POPOVER_EST_WIDTH_PX + offset
  const spaceRight = window.innerWidth - rect.right - pad
  const spaceLeft = rect.left - pad

  if (spaceRight >= needW) return 'right'
  if (spaceLeft >= needW) return 'left'
  return spaceRight >= spaceLeft ? 'right' : 'left'
}

const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/

function getScrollableAncestors(node: HTMLElement | null): HTMLElement[] {
  if (!node) return []
  const ancestors: HTMLElement[] = []
  let parent = node.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    if (
      SCROLLABLE_OVERFLOW.test(style.overflowY) ||
      SCROLLABLE_OVERFLOW.test(style.overflowX) ||
      SCROLLABLE_OVERFLOW.test(style.overflow)
    ) {
      ancestors.push(parent)
    }
    parent = parent.parentElement
  }
  ancestors.push(document.documentElement)
  return ancestors
}

function schedulePopoverPointerSync(callback: () => void): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback)
  })
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const onChange = () => setMatches(mediaQuery.matches)
    onChange()
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [query])

  return matches
}

function enhanceEventPopoverTrigger(
  child: React.ReactElement,
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>,
): React.ReactElement {
  type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement>
  }
  const childProps = child.props as TriggerProps

  return React.cloneElement(child, {
    ref: (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      const { ref } = childProps
      if (typeof ref === 'function') ref(node)
      else if (ref && typeof ref === 'object') ref.current = node
    },
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      triggerRef.current = event.currentTarget
      childProps.onPointerDown?.(event)
    },
  } as TriggerProps)
}

function alignPopoverPointerToTrigger(
  trigger: HTMLElement,
  content: HTMLElement,
): void {
  const triggerRect = trigger.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  const side = content.getAttribute('data-side')
  if (!side) return

  if (side === 'left' || side === 'right') {
    const triggerCenterY = triggerRect.top + triggerRect.height / 2
    let pointerY = triggerCenterY - contentRect.top
    pointerY = Math.min(
      contentRect.height - POPOVER_POINTER_EDGE_PADDING_PX,
      Math.max(POPOVER_POINTER_EDGE_PADDING_PX, pointerY),
    )
    content.style.setProperty('--popover-pointer-y', `${pointerY}px`)
    content.style.removeProperty('--popover-pointer-x')
  }
}

function EventPopoverWrap({
  event,
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
  children,
}: {
  event: FullCalendarEvent
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
  children: React.ReactElement
}) {
  const open = openEventId === event.id
  const [popoverSide, setPopoverSide] = React.useState<EventPopoverSide>('right')
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        if (usePopoverPresentation && triggerRef.current) {
          setPopoverSide(pickEventPopoverSide(triggerRef.current))
        }
        onOpenEventIdChange(event.id)
        return
      }
      if (openEventId === event.id) {
        onOpenEventIdChange(null)
      }
    },
    [event.id, onOpenEventIdChange, openEventId, usePopoverPresentation],
  )

  const handleMobileToggle = React.useCallback(
    (eventClick: React.MouseEvent<HTMLButtonElement>) => {
      eventClick.stopPropagation()
      onOpenEventIdChange(open ? null : event.id)
    },
    [event.id, onOpenEventIdChange, open],
  )

  const syncPointer = React.useCallback(() => {
    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return
    if (!content.getAttribute('data-side')) return
    alignPopoverPointerToTrigger(trigger, content)
  }, [])

  const syncPointerWithRetry = React.useCallback(
    (attempt = 0) => {
      const trigger = triggerRef.current
      const content = contentRef.current
      if (!trigger || !content) return
      if (!content.getAttribute('data-side')) {
        if (attempt < 12) {
          window.requestAnimationFrame(() => syncPointerWithRetry(attempt + 1))
        }
        return
      }
      alignPopoverPointerToTrigger(trigger, content)
    },
    [],
  )

  const handleContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (!node || !open) return
      window.requestAnimationFrame(() => syncPointerWithRetry())
    },
    [open, syncPointerWithRetry],
  )

  React.useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return

    syncPointerWithRetry()
    const frame = window.requestAnimationFrame(syncPointer)
    const frame2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(syncPointer)
    })
    const resizeObserver = new ResizeObserver(syncPointer)
    resizeObserver.observe(content)
    resizeObserver.observe(trigger)
    const mutationObserver = new MutationObserver(() => {
      schedulePopoverPointerSync(syncPointer)
    })
    mutationObserver.observe(content, {
      attributes: true,
      attributeFilter: ['data-side', 'style'],
    })
    const onScroll = () => {
      schedulePopoverPointerSync(syncPointer)
    }
    const scrollTargets = getScrollableAncestors(trigger)
    for (const target of scrollTargets) {
      target.addEventListener('scroll', onScroll, { passive: true })
    }
    window.addEventListener('resize', syncPointer)
    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(frame2)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      for (const target of scrollTargets) {
        target.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', syncPointer)
    }
  }, [open, syncPointer, syncPointerWithRetry])

  if (!renderEventPopover) {
    return children
  }

  if (!usePopoverPresentation) {
    type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
      ref?: React.Ref<HTMLButtonElement>
    }
    const childProps = children.props as TriggerProps
    return React.cloneElement(children, {
      ref: (node: HTMLButtonElement | null) => {
        triggerRef.current = node
        const { ref } = childProps
        if (typeof ref === 'function') ref(node)
        else if (ref && typeof ref === 'object') ref.current = node
      },
      onClick: (clickEvent: React.MouseEvent<HTMLButtonElement>) => {
        childProps.onClick?.(clickEvent)
        if (!clickEvent.defaultPrevented) {
          handleMobileToggle(clickEvent)
        }
      },
      'aria-expanded': open,
    } as TriggerProps)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {enhanceEventPopoverTrigger(children, triggerRef)}
      </PopoverTrigger>
      {open ? (
        <PopoverContent
          ref={handleContentRef}
          align="center"
          side={popoverSide}
          sideOffset={POPOVER_SIDE_OFFSET_PX}
          collisionPadding={POPOVER_COLLISION_PADDING_PX}
          updatePositionStrategy="always"
          surface="white"
          showPointer
          horizontalPointer
          className="w-[min(22rem,calc(100vw-2rem))] p-0"
          onClick={(e) => e.stopPropagation()}
          onPlaced={syncPointer}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            syncPointerWithRetry()
          }}
        >
          {renderEventPopover(event, { close: () => onOpenEventIdChange(null), presentation: 'popover' })}
        </PopoverContent>
      ) : null}
    </Popover>
  )
}

function EventIssueInfo({ detail }: { detail: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-sm p-0.5 text-destructive hover:bg-destructive/10"
          aria-label="Event issue details"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Info className="h-3 w-3" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-xs p-3 text-sm leading-snug"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {detail}
      </PopoverContent>
    </Popover>
  )
}

function EventChip({
  event,
  style,
  className,
  onEventClick,
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
}: {
  event: FullCalendarEvent
  style?: React.CSSProperties
  className?: string
  onEventClick?: FullCalendarProps['onEventClick']
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
}) {
  const interactive = Boolean(onEventClick) || Boolean(renderEventPopover)
  return (
    <div
      className={cn(
        'absolute left-0.5 right-0.5 z-10 flex overflow-hidden rounded-md text-xs text-foreground',
        eventChipToneClass(event),
        className,
      )}
      style={{
        ...style,
        ...(event.color ? { backgroundColor: event.color } : undefined),
      }}
    >
      <EventPopoverWrap
        event={event}
        renderEventPopover={renderEventPopover}
        openEventId={openEventId}
        onOpenEventIdChange={onOpenEventIdChange}
        usePopoverPresentation={usePopoverPresentation}
      >
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
            'flex min-w-0 flex-1 items-start gap-1 overflow-hidden px-1 py-0.5 text-left',
            interactive && 'cursor-pointer hover:opacity-90',
            !interactive && 'cursor-default',
          )}
          title={event.title}
        >
          <CalendarEventThumb event={event} className={CALENDAR_EVENT_TIMELINE_THUMB_CLASS} />
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate font-medium">{event.title}</span>
            {event.subtitle ? (
              <span className="block truncate text-[10px] text-destructive">{event.subtitle}</span>
            ) : null}
          </span>
        </button>
      </EventPopoverWrap>
      {event.issueDetail ? <EventIssueInfo detail={event.issueDetail} /> : null}
    </div>
  )
}

function TimelineColumn({
  day,
  events,
  onSlotClick,
  onEventClick,
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
  showGutter,
}: {
  day: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
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
                interactiveSlots && cn('cursor-pointer', interactiveHoverClassName),
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
                  ? `Slot ${formatPickerDateTime(range.start)}`
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
            renderEventPopover={renderEventPopover}
            openEventId={openEventId}
            onOpenEventIdChange={onOpenEventIdChange}
            usePopoverPresentation={usePopoverPresentation}
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
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
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
        {formatPickerDate(day)}
      </div>
      <TimelineColumn
        day={day}
        events={events}
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
        renderEventPopover={renderEventPopover}
        openEventId={openEventId}
        onOpenEventIdChange={onOpenEventIdChange}
        usePopoverPresentation={usePopoverPresentation}
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
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
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
            renderEventPopover={renderEventPopover}
            openEventId={openEventId}
            onOpenEventIdChange={onOpenEventIdChange}
            usePopoverPresentation={usePopoverPresentation}
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
  renderEventPopover,
  openEventId,
  onOpenEventIdChange,
  usePopoverPresentation,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventClick?: FullCalendarProps['onEventClick']
  renderEventPopover?: FullCalendarProps['renderEventPopover']
  openEventId: string | null
  onOpenEventIdChange: (eventId: string | null) => void
  usePopoverPresentation: boolean
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
        {days.map((day, index) => {
          const inMonth = day.getMonth() === month
          const isLastCol = index % 7 === 6
          const isLastRow = index >= days.length - 7
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
                'min-h-0 overflow-hidden border-border p-1',
                !isLastCol && 'border-r',
                !isLastRow && 'border-b',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isToday(day) && 'bg-accent/40',
                interactive && cn('cursor-pointer', interactiveHoverClassName),
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
                {visible.map((event) => {
                  const eventInteractive = Boolean(onEventClick) || Boolean(renderEventPopover)
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center rounded-md text-xs text-foreground',
                        eventChipToneClass(event),
                      )}
                      style={event.color ? { backgroundColor: event.color } : undefined}
                    >
                      <EventPopoverWrap
                        event={event}
                        renderEventPopover={renderEventPopover}
                        openEventId={openEventId}
                        onOpenEventIdChange={onOpenEventIdChange}
                        usePopoverPresentation={usePopoverPresentation}
                      >
                        <button
                          type="button"
                          tabIndex={eventInteractive ? 0 : -1}
                          disabled={!eventInteractive}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event)
                          }}
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-1 px-1 py-0.5 text-left',
                            eventInteractive ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
                          )}
                          title={event.title}
                        >
                          <CalendarEventThumb event={event} />
                          <span className="truncate">{event.title}</span>
                        </button>
                      </EventPopoverWrap>
                      {event.issueDetail ? <EventIssueInfo detail={event.issueDetail} /> : null}
                    </div>
                  )
                })}
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
  renderEventPopover,
  renderEventDetailPanelTitle,
  showToolbar = true,
  className,
  id,
}: FullCalendarProps) {
  const label = formatPeriodLabel(anchorDate, view)
  const [openEventId, setOpenEventId] = React.useState<string | null>(null)
  const usePopoverPresentation = useMediaQuery('(min-width: 768px)')
  const selectedEvent = openEventId ? events.find((event) => event.id === openEventId) : null

  return (
    <>
    <div
      id={id}
      className={cn(
        'flex min-h-[28rem] flex-1 flex-col overflow-hidden ui-shape-panel bg-[hsl(var(--background-base))]',
        shapePanelBorderedClassName,
        className,
      )}
    >
      {showToolbar ? (
        <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-[hsl(var(--background-base))] p-3 md:grid md:grid-cols-3 md:items-center">
          <PeriodNav
            label={label}
            onPrev={() => onAnchorDateChange(shiftAnchor(anchorDate, view, -1))}
            onNext={() => onAnchorDateChange(shiftAnchor(anchorDate, view, 1))}
          />
          <div className="flex items-center justify-between md:contents">
            <div className="md:col-start-1 md:row-start-1 md:justify-self-start">
              <TodayButton
                onClick={() => onAnchorDateChange(startOfLocalDay(new Date()))}
              />
            </div>
            <div className="md:col-start-3 md:row-start-1 md:justify-self-end">
              <ViewSwitcher view={view} onViewChange={onViewChange} />
            </div>
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
            renderEventPopover={renderEventPopover}
            openEventId={openEventId}
            onOpenEventIdChange={setOpenEventId}
            usePopoverPresentation={usePopoverPresentation}
          />
        ) : null}
        {view === 'week' ? (
          <WeekView
            anchorDate={anchorDate}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
            renderEventPopover={renderEventPopover}
            openEventId={openEventId}
            onOpenEventIdChange={setOpenEventId}
            usePopoverPresentation={usePopoverPresentation}
          />
        ) : null}
        {view === 'month' ? (
          <MonthView
            anchorDate={anchorDate}
            events={events}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
            renderEventPopover={renderEventPopover}
            openEventId={openEventId}
            onOpenEventIdChange={setOpenEventId}
            usePopoverPresentation={usePopoverPresentation}
          />
        ) : null}
      </div>
    </div>
    {!usePopoverPresentation && renderEventPopover && selectedEvent ? (
      <ListFilterPanel
        open={Boolean(openEventId)}
        onOpenChange={(open) => {
          if (!open) setOpenEventId(null)
        }}
        title={renderEventDetailPanelTitle?.(selectedEvent) ?? selectedEvent.title}
      >
        {renderEventPopover(selectedEvent, {
          close: () => setOpenEventId(null),
          presentation: 'panel',
        })}
      </ListFilterPanel>
    ) : null}
    </>
  )
}

export { FullCalendar }
