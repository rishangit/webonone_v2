import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  HOUR_HEIGHT_PX,
  WEEKDAY_LABELS,
  addDays,
  eventLayoutInDay,
  eventsForDay,
  formatPeriodLabel,
  formatPickerDate,
  hourSlotRange,
  isSameDay,
  isToday,
  monthGridDays,
  shiftAnchor,
  startOfLocalDay,
  startOfWeek,
  type FullCalendarEvent,
  type FullCalendarView,
} from '../lib/fullCalendarUtils'
import { useThemeColors } from '../theme/ThemeProvider'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { ImagePreview } from './ImagePreview'
import { ListFilterPanel } from './ListFilterPanel'
import { SegmentedSwitch, SegmentedSwitchItem } from './SegmentedSwitch'
import { Body, Muted } from './Typography'

export type { FullCalendarEvent, FullCalendarView }

export type FullCalendarEventPopoverCtx = {
  close: () => void
  presentation: 'popover' | 'panel'
}

export interface FullCalendarProps {
  view: FullCalendarView
  onViewChange: (view: FullCalendarView) => void
  anchorDate: Date
  onAnchorDateChange: (date: Date) => void
  events?: FullCalendarEvent[]
  onSlotClick?: (range: { start: Date; end: Date }) => void
  /** Week view: tap a column header to focus that day (e.g. switch to day view). */
  onDayHeaderPress?: (date: Date) => void
  onEventClick?: (event: FullCalendarEvent) => void
  renderEventPopover?: (
    event: FullCalendarEvent,
    ctx: FullCalendarEventPopoverCtx,
  ) => ReactNode
  renderEventDetailPanelTitle?: (event: FullCalendarEvent) => string
  showToolbar?: boolean
  className?: string
}

const VIEWS: FullCalendarView[] = ['day', 'week', 'month']
const VIEW_LABELS: Record<FullCalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
}
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MONTH_EVENT_LIMIT = 3
const GUTTER_WIDTH_CLASS = 'w-14'
/** Week view: compact time gutter; day columns share remaining width (no horizontal scroll). */
const WEEK_GUTTER_WIDTH = 32
const CALENDAR_EVENT_THUMB_CLASS = 'h-4 w-4 shrink-0 rounded-sm'
const CALENDAR_EVENT_TIMELINE_THUMB_CLASS = 'h-5 w-5 shrink-0 rounded-sm'

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function eventChipToneClass(event: FullCalendarEvent): string | undefined {
  if (event.color) return undefined
  return event.issueDetail ? 'bg-destructive/15' : 'bg-primary/15'
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

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
      className={cn(CALENDAR_EVENT_THUMB_CLASS, className)}
    />
  )
}

function EventIssueInfo({ detail }: { detail: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Event issue details"
        onPress={(e) => {
          e.stopPropagation?.()
          setOpen(true)
        }}
        className="shrink-0 rounded-sm p-0.5"
      >
        <Info size={12} color="#dc2626" />
      </Pressable>
      <CustomDialog
        open={open}
        onOpenChange={setOpen}
        title="Event issue"
        sizeWidth="small"
        sizeHeight="auto"
        footer={
          <Button variant="outline" onPress={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <Body className="text-sm leading-snug">{detail}</Body>
      </CustomDialog>
    </>
  )
}

function TodayButton({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="outline" size="sm" onPress={onPress}>
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
  const iconColor = useThemedControlIconColor()
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Button
        variant="outline"
        size="icon"
        accessibilityLabel="Previous period"
        onPress={onPrev}
        className="h-8 w-8 shrink-0"
      >
        <ChevronLeft size={16} color={iconColor} />
      </Button>
      <Text className="min-w-0 flex-1 text-center text-sm font-medium text-foreground">{label}</Text>
      <Button
        variant="outline"
        size="icon"
        accessibilityLabel="Next period"
        onPress={onNext}
        className="h-8 w-8 shrink-0"
      >
        <ChevronRight size={16} color={iconColor} />
      </Button>
    </View>
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
      size="sm"
      accessibilityLabel="Calendar view"
      className="w-full"
    >
      {VIEWS.map((item) => (
        <SegmentedSwitchItem key={item} value={item}>
          {VIEW_LABELS[item]}
        </SegmentedSwitchItem>
      ))}
    </SegmentedSwitch>
  )
}

function EventChip({
  event,
  layout,
  onEventPress,
}: {
  event: FullCalendarEvent
  layout?: { top: number; height: number }
  onEventPress: () => void
}) {
  const interactive = true
  const toneClass = eventChipToneClass(event)
  const containerClass = cn(
    layout ? 'absolute left-0.5 right-0.5 z-10 flex overflow-hidden rounded-md' : 'flex items-center rounded-md',
    toneClass,
  )
  const chipBody = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={event.title}
      onPress={(e) => {
        e.stopPropagation?.()
        onEventPress()
      }}
      className={cn(
        'min-w-0 flex-1 flex-row items-start gap-1 overflow-hidden px-1 py-0.5',
        interactive && 'active:opacity-90',
      )}
    >
      <CalendarEventThumb
        event={event}
        className={layout ? CALENDAR_EVENT_TIMELINE_THUMB_CLASS : undefined}
      />
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
          {event.title}
        </Text>
        {event.subtitle ? (
          <Text className="text-[10px] text-destructive" numberOfLines={1}>
            {event.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )

  if (layout) {
    return (
      <View
        className={containerClass}
        style={{
          top: layout.top,
          height: layout.height,
          ...(event.color ? { backgroundColor: event.color } : undefined),
        }}
      >
        {chipBody}
        {event.issueDetail ? <EventIssueInfo detail={event.issueDetail} /> : null}
      </View>
    )
  }

  return (
    <View
      className={containerClass}
      style={event.color ? { backgroundColor: event.color } : undefined}
    >
      {chipBody}
      {event.issueDetail ? <EventIssueInfo detail={event.issueDetail} /> : null}
    </View>
  )
}

function weekColumnBorderStyle(borderColor: string): ViewStyle {
  return {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: borderColor,
  }
}

function TimelineColumn({
  day,
  events,
  onSlotClick,
  onEventPress,
  showGutter,
  fixedWidth,
  columnBorderStyle,
}: {
  day: Date
  events: FullCalendarEvent[]
  onSlotClick?: (range: { start: Date; end: Date }) => void
  onEventPress: (event: FullCalendarEvent) => void
  showGutter: boolean
  fixedWidth?: number
  columnBorderStyle?: ViewStyle
}) {
  const dayEvents = eventsForDay(events, day)
  const interactiveSlots = Boolean(onSlotClick)
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX

  const dayColumnStyle: ViewStyle = {
    height: gridHeight,
    ...(fixedWidth != null ? { width: fixedWidth } : undefined),
    ...columnBorderStyle,
  }

  const dayColumnClass = cn(
    'relative min-w-0 flex-1',
    fixedWidth == null && columnBorderStyle == null && 'border-r border-border',
  )

  const daySlots = (
    <View className={dayColumnClass} style={dayColumnStyle}>
      {HOURS.map((hour) => {
        const range = hourSlotRange(day, hour)
        return (
          <Pressable
            key={hour}
            accessibilityRole={interactiveSlots ? 'button' : undefined}
            disabled={!interactiveSlots}
            onPress={() => onSlotClick?.(range)}
            className="border-b border-border"
            style={{ height: HOUR_HEIGHT_PX }}
          />
        )
      })}
      {dayEvents.map((event) => (
        <EventChip
          key={event.id}
          event={event}
          layout={eventLayoutInDay(event, day)}
          onEventPress={() => onEventPress(event)}
        />
      ))}
    </View>
  )

  if (!showGutter) {
    return daySlots
  }

  return (
    <View className="relative min-w-0 flex-1 flex-row">
      <View className={cn(GUTTER_WIDTH_CLASS, 'shrink-0 border-r border-border')} style={{ height: gridHeight }}>
        {HOURS.map((hour) => (
          <View key={hour} className="justify-start pr-2" style={{ height: HOUR_HEIGHT_PX }}>
            <Muted className="text-right text-xs">{formatHourLabel(hour)}</Muted>
          </View>
        ))}
      </View>
      {daySlots}
    </View>
  )
}

function DayView({
  anchorDate,
  events,
  onSlotClick,
  onEventPress,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventPress: (event: FullCalendarEvent) => void
}) {
  const day = startOfLocalDay(anchorDate)
  return (
    <View className="min-h-0 flex-1">
      <View
        className={cn(
          'border-b border-border px-3 py-2',
          isToday(day) ? 'bg-accent' : 'bg-surface',
        )}
      >
        <Body className="text-sm font-medium">{formatPickerDate(day)}</Body>
      </View>
      <ScrollView className="min-h-0 flex-1" nestedScrollEnabled>
        <TimelineColumn
          day={day}
          events={events}
          onSlotClick={onSlotClick}
          onEventPress={onEventPress}
          showGutter
        />
      </ScrollView>
    </View>
  )
}

function WeekView({
  anchorDate,
  events,
  onSlotClick,
  onDayHeaderPress,
  onEventPress,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onDayHeaderPress: (date: Date) => void
  onEventPress: (event: FullCalendarEvent) => void
}) {
  const colors = useThemeColors()
  const columnBorderStyle = useMemo(() => weekColumnBorderStyle(colors.border), [colors.border])

  const days = useMemo(() => {
    const weekStart = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [anchorDate])
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX

  return (
    <View className="min-h-0 flex-1">
      <View className="z-10 flex-row border-b border-border bg-surface">
        <View
          className="shrink-0 border-r border-border"
          style={{ width: WEEK_GUTTER_WIDTH }}
        />
        {days.map((day) => {
          const selected = isSameDay(day, anchorDate)
          const today = isToday(day)
          return (
            <Pressable
              key={toDayKey(day)}
              accessibilityRole="button"
              accessibilityLabel={formatPickerDate(day)}
              accessibilityState={{ selected }}
              onPress={() => onDayHeaderPress(startOfLocalDay(day))}
              style={[{ flex: 1, minWidth: 0 }, columnBorderStyle]}
              className={cn(
                'items-center px-0.5 py-1.5 active:opacity-80',
                today && !selected && 'bg-accent',
                selected && 'bg-primary/15',
              )}
            >
              <Muted className="text-[10px]">{WEEKDAY_LABELS[day.getDay()]}</Muted>
              <Text
                className={cn(
                  'text-xs font-medium',
                  selected || today ? 'text-primary' : 'text-foreground',
                )}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <ScrollView className="min-h-0 flex-1" nestedScrollEnabled showsVerticalScrollIndicator>
        <View className="flex-row" style={{ height: gridHeight }}>
          <View
            className="shrink-0 border-r border-border bg-surface"
            style={{ width: WEEK_GUTTER_WIDTH, height: gridHeight }}
          >
            {HOURS.map((hour) => (
              <View key={hour} className="justify-start px-0.5" style={{ height: HOUR_HEIGHT_PX }}>
                <Muted className="text-right text-[10px] leading-tight">{formatHourLabel(hour)}</Muted>
              </View>
            ))}
          </View>
          {days.map((day) => (
            <TimelineColumn
              key={toDayKey(day)}
              day={day}
              events={events}
              onSlotClick={onSlotClick}
              onEventPress={onEventPress}
              showGutter={false}
              columnBorderStyle={columnBorderStyle}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function MonthView({
  anchorDate,
  events,
  onSlotClick,
  onEventPress,
}: {
  anchorDate: Date
  events: FullCalendarEvent[]
  onSlotClick?: FullCalendarProps['onSlotClick']
  onEventPress: (event: FullCalendarEvent) => void
}) {
  const days = monthGridDays(anchorDate)
  const month = anchorDate.getMonth()
  const interactive = Boolean(onSlotClick)
  const weekCount = days.length / 7

  return (
    <View className="min-h-0 flex-1 flex-col">
      <View className="shrink-0 flex-row border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <Muted
            key={label}
            className="flex-1 border-r border-border py-2 text-center text-xs font-medium last:border-r-0"
          >
            {label}
          </Muted>
        ))}
      </View>
      <View className="min-h-0 flex-1">
        {Array.from({ length: weekCount }, (_, weekIndex) => (
          <View key={weekIndex} className="min-h-0 flex-1 flex-row">
            {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, colIndex) => {
              const inMonth = day.getMonth() === month
              const isLastCol = colIndex === 6
              const isLastRow = weekIndex === weekCount - 1
              const dayEvents = eventsForDay(events, day)
              const visible = dayEvents.slice(0, MONTH_EVENT_LIMIT)
              const overflow = dayEvents.length - visible.length
              const dayStart = startOfLocalDay(day)
              const dayEnd = addDays(dayStart, 1)

              return (
                <Pressable
                  key={toDayKey(day)}
                  accessibilityRole={interactive ? 'button' : undefined}
                  disabled={!interactive}
                  onPress={() => onSlotClick?.({ start: dayStart, end: dayEnd })}
                  className={cn(
                    'min-h-0 flex-1 overflow-hidden border-border p-1',
                    !isLastCol && 'border-r',
                    !isLastRow && 'border-b',
                    !inMonth && 'bg-muted/20',
                    isToday(day) && 'bg-accent/40',
                  )}
                >
                  <View
                    className={cn(
                      'mb-1 h-6 w-6 items-center justify-center rounded-md',
                      isToday(day) && 'bg-primary',
                      !inMonth && 'opacity-60',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs',
                        isToday(day) ? 'font-medium text-primary-foreground' : 'text-foreground',
                        !inMonth && !isToday(day) && 'text-muted',
                      )}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  <View className="gap-0.5">
                    {visible.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        onEventPress={() => onEventPress(event)}
                      />
                    ))}
                    {overflow > 0 ? (
                      <Muted className="px-1 text-xs">+{overflow} more</Muted>
                    ) : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

export function FullCalendar({
  view,
  onViewChange,
  anchorDate,
  onAnchorDateChange,
  events = [],
  onSlotClick,
  onDayHeaderPress,
  onEventClick,
  renderEventPopover,
  renderEventDetailPanelTitle,
  showToolbar = true,
  className,
}: FullCalendarProps) {
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const periodLabel = useMemo(() => formatPeriodLabel(anchorDate, view), [anchorDate, view])
  const selectedEvent = openEventId ? events.find((event) => event.id === openEventId) : null

  const handleDayHeaderPress = useCallback(
    (date: Date) => {
      const day = startOfLocalDay(date)
      if (onDayHeaderPress) {
        onDayHeaderPress(day)
        return
      }
      onAnchorDateChange(day)
      onViewChange('day')
    },
    [onAnchorDateChange, onDayHeaderPress, onViewChange],
  )

  function handleEventPress(event: FullCalendarEvent) {
    onEventClick?.(event)
    if (renderEventPopover) {
      setOpenEventId(event.id)
    }
  }

  function closeDetail() {
    setOpenEventId(null)
  }

  const panelTitle = selectedEvent
    ? renderEventDetailPanelTitle?.(selectedEvent) ?? selectedEvent.title
    : 'Session details'

  return (
    <>
      <View
        className={cn(
          'min-h-[28rem] flex-1 overflow-hidden rounded-lg border border-border bg-background',
          className,
        )}
      >
        {showToolbar ? (
          <View className="shrink-0 gap-2 border-b border-border bg-background p-3">
            <PeriodNav
              label={periodLabel}
              onPrev={() => onAnchorDateChange(shiftAnchor(anchorDate, view, -1))}
              onNext={() => onAnchorDateChange(shiftAnchor(anchorDate, view, 1))}
            />
            <View className="flex-row items-center gap-2">
              <TodayButton onPress={() => onAnchorDateChange(startOfLocalDay(new Date()))} />
              <View className="min-w-0 flex-1">
                <ViewSwitcher view={view} onViewChange={onViewChange} />
              </View>
            </View>
          </View>
        ) : null}

        <View className={cn('min-h-0 flex-1', view === 'month' ? 'flex flex-col' : '')}>
          {view === 'day' ? (
            <DayView
              anchorDate={anchorDate}
              events={events}
              onSlotClick={onSlotClick}
              onEventPress={handleEventPress}
            />
          ) : null}
          {view === 'week' ? (
            <WeekView
              anchorDate={anchorDate}
              events={events}
              onSlotClick={onSlotClick}
              onDayHeaderPress={handleDayHeaderPress}
              onEventPress={handleEventPress}
            />
          ) : null}
          {view === 'month' ? (
            <MonthView
              anchorDate={anchorDate}
              events={events}
              onSlotClick={onSlotClick}
              onEventPress={handleEventPress}
            />
          ) : null}
        </View>
      </View>

      {renderEventPopover && selectedEvent ? (
        <ListFilterPanel open={openEventId !== null} onOpenChange={(open) => !open && closeDetail()} title={panelTitle}>
          {renderEventPopover(selectedEvent, { close: closeDetail, presentation: 'panel' })}
        </ListFilterPanel>
      ) : null}
    </>
  )
}
