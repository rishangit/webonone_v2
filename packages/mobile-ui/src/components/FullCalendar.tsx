import { useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  HOUR_HEIGHT_PX,
  WEEKDAY_LABELS,
  addDays,
  eventLayoutInDay,
  eventsForDay,
  formatPeriodLabel,
  isToday,
  monthGridDays,
  shiftAnchor,
  startOfWeek,
  type FullCalendarEvent,
  type FullCalendarView,
} from '../lib/fullCalendarUtils'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { ImagePreview } from './ImagePreview'
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
const WEEK_COL_WIDTH = 88

function formatHourLabel(hour: number): string {
  const date = new Date(2000, 0, 1, hour)
  return date.toLocaleTimeString('en', { hour: 'numeric' })
}

function CalendarEventThumb({ event, className }: { event: FullCalendarEvent; className?: string }) {
  if (!event.imageUrl) return null
  return (
    <ImagePreview src={event.imageUrl} alt={event.title} className={cn('h-5 w-5 rounded-sm', className)} />
  )
}

function EventChip({
  event,
  compact,
  onPress,
}: {
  event: FullCalendarEvent
  compact?: boolean
  onPress?: () => void
}) {
  const toneClass = event.issueDetail ? 'bg-destructive/15' : 'bg-primary/15'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={event.title}
      onPress={onPress}
      className={cn('min-w-0 overflow-hidden rounded-md px-1 py-0.5', toneClass)}
      style={event.color ? { backgroundColor: event.color } : undefined}
    >
      <View className="min-w-0 flex-row items-start gap-1">
        <CalendarEventThumb event={event} className={compact ? 'h-4 w-4' : undefined} />
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
        {event.issueDetail ? <Info size={12} color="#dc2626" /> : null}
      </View>
    </Pressable>
  )
}

function HourGrid({
  days,
  events,
  onEventPress,
  columnWidth,
}: {
  days: Date[]
  events: FullCalendarEvent[]
  onEventPress: (event: FullCalendarEvent) => void
  columnWidth?: number
}) {
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX
  return (
    <View className="flex-row">
      <View className="w-12 shrink-0">
        {HOURS.map((hour) => (
          <View key={hour} className="justify-start border-t border-border" style={{ height: HOUR_HEIGHT_PX }}>
            <Muted className="px-0.5 text-[10px]">{formatHourLabel(hour)}</Muted>
          </View>
        ))}
      </View>
      {days.map((day) => {
        const dayEvents = eventsForDay(events, day)
        return (
          <View
            key={toDayKey(day)}
            className="relative flex-1 border-l border-border"
            style={{ height: gridHeight, width: columnWidth, minWidth: columnWidth }}
          >
            {HOURS.map((hour) => (
              <View
                key={hour}
                className="border-t border-border"
                style={{ height: HOUR_HEIGHT_PX }}
              />
            ))}
            {dayEvents.map((event) => {
              const layout = eventLayoutInDay(event, day)
              return (
                <View
                  key={event.id}
                  className="absolute left-0.5 right-0.5 z-10"
                  style={{ top: layout.top, height: layout.height }}
                >
                  <EventChip event={event} onPress={() => onEventPress(event)} />
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function FullCalendar({
  view,
  onViewChange,
  anchorDate,
  onAnchorDateChange,
  events = [],
  onSlotClick: _onSlotClick,
  onEventClick,
  renderEventPopover,
  renderEventDetailPanelTitle,
  showToolbar = true,
  className,
}: FullCalendarProps) {
  const iconColor = useThemedControlIconColor()
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null)
  const periodLabel = useMemo(() => formatPeriodLabel(anchorDate, view), [anchorDate, view])
  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [anchorDate])
  const monthDays = useMemo(() => monthGridDays(anchorDate), [anchorDate])

  function handleEventPress(event: FullCalendarEvent) {
    onEventClick?.(event)
    if (renderEventPopover) {
      setSelectedEvent(event)
    }
  }

  function closeDetail() {
    setSelectedEvent(null)
  }

  const detailTitle = selectedEvent
    ? renderEventDetailPanelTitle?.(selectedEvent) ?? selectedEvent.title
    : 'Session details'

  return (
    <View className={cn('gap-3', className)}>
      {showToolbar ? (
        <View className="gap-2">
          <SegmentedSwitch
            value={view}
            onValueChange={(next) => onViewChange(next as FullCalendarView)}
          >
            {VIEWS.map((item) => (
              <SegmentedSwitchItem key={item} value={item}>
                {VIEW_LABELS[item]}
              </SegmentedSwitchItem>
            ))}
          </SegmentedSwitch>
          <View className="flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              accessibilityLabel="Previous period"
              onPress={() => onAnchorDateChange(shiftAnchor(anchorDate, view, -1))}
            >
              <ChevronLeft size={20} color={iconColor} />
            </Button>
            <Body className="min-w-0 flex-1 text-center text-sm font-medium">{periodLabel}</Body>
            <Button
              variant="outline"
              size="icon"
              accessibilityLabel="Next period"
              onPress={() => onAnchorDateChange(shiftAnchor(anchorDate, view, 1))}
            >
              <ChevronRight size={20} color={iconColor} />
            </Button>
          </View>
          <Button variant="outline" size="sm" onPress={() => onAnchorDateChange(new Date())}>
            Today
          </Button>
        </View>
      ) : null}

      {view === 'month' ? (
        <View className="overflow-hidden rounded-lg border border-border">
          <View className="flex-row border-b border-border bg-surface">
            {WEEKDAY_LABELS.map((label) => (
              <Muted key={label} className="flex-1 py-1 text-center text-[11px] font-medium">
                {label}
              </Muted>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {monthDays.map((day) => {
              const inMonth = day.getMonth() === anchorDate.getMonth()
              const dayEvents = eventsForDay(events, day)
              const extra = Math.max(0, dayEvents.length - MONTH_EVENT_LIMIT)
              const visible = dayEvents.slice(0, MONTH_EVENT_LIMIT)
              return (
                <Pressable
                  key={toDayKey(day)}
                  onPress={() => {
                    onAnchorDateChange(day)
                    onViewChange('day')
                  }}
                  className={cn(
                    'min-h-[88px] w-[14.28%] border-b border-r border-border p-1',
                    isToday(day) && 'bg-primary/10',
                  )}
                >
                  <Text
                    className={cn(
                      'mb-1 text-xs',
                      inMonth ? 'text-foreground' : 'text-muted',
                      isToday(day) && 'font-semibold text-primary',
                    )}
                  >
                    {day.getDate()}
                  </Text>
                  <View className="gap-0.5">
                    {visible.map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        compact
                        onPress={() => handleEventPress(event)}
                      />
                    ))}
                    {extra > 0 ? <Muted className="text-[10px]">+{extra} more</Muted> : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      {view === 'week' ? (
        <View className="overflow-hidden rounded-lg border border-border">
          <ScrollView horizontal>
            <View>
              <View className="flex-row border-b border-border bg-surface">
                <View className="w-12" />
                {weekDays.map((day) => (
                  <Pressable
                    key={toDayKey(day)}
                    onPress={() => {
                      onAnchorDateChange(day)
                      onViewChange('day')
                    }}
                    style={{ width: WEEK_COL_WIDTH }}
                    className={cn('items-center py-1', isToday(day) && 'bg-primary/10')}
                  >
                    <Muted className="text-[10px]">{WEEKDAY_LABELS[day.getDay()]}</Muted>
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        isToday(day) ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <HourGrid
                days={weekDays}
                events={events}
                onEventPress={handleEventPress}
                columnWidth={WEEK_COL_WIDTH}
              />
            </View>
          </ScrollView>
        </View>
      ) : null}

      {view === 'day' ? (
        <View className="overflow-hidden rounded-lg border border-border">
          <View className="border-b border-border bg-surface px-3 py-2">
            <Body className="text-sm font-medium">
              {WEEKDAY_LABELS[anchorDate.getDay()]} · {formatPeriodLabel(anchorDate, 'day')}
            </Body>
          </View>
          <HourGrid days={[anchorDate]} events={events} onEventPress={handleEventPress} />
        </View>
      ) : null}

      {renderEventPopover ? (
        <CustomDialog
          open={selectedEvent !== null}
          onOpenChange={(open) => {
            if (!open) closeDetail()
          }}
          title={detailTitle}
          sizeWidth="medium"
          sizeHeight="large"
          footer={
            <Button variant="outline" onPress={closeDetail}>
              Close
            </Button>
          }
        >
          {selectedEvent
            ? renderEventPopover(selectedEvent, { close: closeDetail, presentation: 'panel' })
            : null}
        </CustomDialog>
      ) : null}
    </View>
  )
}
