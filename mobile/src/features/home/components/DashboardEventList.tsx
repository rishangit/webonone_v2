import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  ImagePreview,
  ItemList,
  ItemListEmpty,
  ItemListItem,
  itemListThumbClassName,
  Muted,
  RemainingTime,
  StatusTag,
  type StatusTagVariant,
} from '@webonone/mobile-ui'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import type {
  CompanyEventOccurrence,
  SessionRunStatus,
} from '@/features/calendar/types/event.types'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

type DashboardEventListProps = {
  items: CompanyEventOccurrence[]
  emptyMessage: string
  showDate?: boolean
  onOpen: (item: CompanyEventOccurrence) => void
}

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

const RUN_STATUS_LABEL: Record<SessionRunStatus, string> = {
  scheduled: 'Not started',
  started: 'Started',
  ended: 'Session ended',
}

function occurrenceMeta(item: CompanyEventOccurrence): string {
  const staff = item.staffDisplayName ?? ''
  if (item.attendeeDisplayName) {
    return staff ? `${staff} · ${item.attendeeDisplayName}` : item.attendeeDisplayName
  }
  return staff
}

function occurrenceRunStatus(item: CompanyEventOccurrence): SessionRunStatus {
  return item.runStatus ?? 'scheduled'
}

export function DashboardEventList({
  items,
  emptyMessage,
  showDate = false,
  onOpen,
}: DashboardEventListProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList className="py-0">
      {items.map((item) => {
        const time = `${item.startTime}–${item.endTime}`
        const when = showDate ? `${formatCalendarYmd(item.occurrenceDate)} · ${time}` : time
        const runStatus = occurrenceRunStatus(item)
        const meta = occurrenceMeta(item)

        return (
          <ItemListItem key={`${item.id}:${item.occurrenceDate}`} onPress={() => onOpen(item)}>
            <ImagePreview
              src={item.serviceImageUrl}
              alt={item.serviceName}
              className={itemListThumbClassName}
            />
            <View className="min-w-0 flex-1 gap-1">
              <Body className="text-sm font-semibold" numberOfLines={1}>
                {item.serviceName}
              </Body>
              {meta ? (
                <Muted className="text-xs" numberOfLines={1}>
                  {meta}
                </Muted>
              ) : null}
              <Muted className="text-xs" numberOfLines={1}>
                {when}
              </Muted>
              <SessionScheduleChangeMeta
                scheduleChanged={item.scheduleChanged}
                scheduleChangeKind={item.scheduleChangeKind}
                originalStartTime={item.originalStartTime}
                originalEndTime={item.originalEndTime}
              />
            </View>
            <View className="shrink-0 items-end gap-1 self-center">
              {!showDate ? (
                <>
                  <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                    {RUN_STATUS_LABEL[runStatus]}
                  </StatusTag>
                  {item.viewerCheckedIn === true ? (
                    <StatusTag variant="verified">Checked in</StatusTag>
                  ) : item.viewerCheckedIn === false ? (
                    <StatusTag variant="pending">Not checked in</StatusTag>
                  ) : null}
                </>
              ) : null}
              <RemainingTime
                start={item.start}
                end={item.end}
                now={now}
                runStatus={runStatus}
                labels={{ ended: 'Ended', due: 'Due' }}
                appearance="plain"
              />
            </View>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
