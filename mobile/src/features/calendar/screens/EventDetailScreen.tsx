import { useCallback, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Redirect, useRouter, type Href } from 'expo-router'
import {
  Body,
  Card,
  EditableSectionCard,
  FeatureScreen,
  ImagePreview,
  Muted,
  ReadOnlyField,
  Spinner,
  Subheading,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { EventFormDialog } from '@/features/calendar/components/EventFormDialog'
import { EventSessionsList } from '@/features/calendar/components/EventSessionsList'
import {
  formatRecurrenceLabel,
  formatTimeModeLabel,
  formatWeekdaysLabel,
  type EventWizardStep,
} from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEvent, EventGalleryImage } from '@/features/calendar/types/event.types'
import {
  canAccessCompanySession,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/calendar/utils/calendarAccess'
import { CALENDAR_EVENTS_PATH, sessionDetailPath } from '@/features/calendar/utils/calendarPaths'
import { formatCalendarYmd, formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type EventDetailTab = 'overview' | 'upcoming' | 'past'

function combineEventGalleryImages(detail: CompanyEvent): EventGalleryImage[] {
  const seen = new Set<string>()
  const combined: EventGalleryImage[] = []
  for (const image of [
    ...(detail.serviceGalleryImages ?? []),
    ...(detail.spaceGalleryImages ?? []),
  ]) {
    if (!image.mediaId || seen.has(image.mediaId)) continue
    seen.add(image.mediaId)
    combined.push(image)
  }
  return combined
}

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { user } = useSession()
  const personal = isPersonalCalendarSession(user?.role, user?.companyId)
  const canEdit = canManageCompanyEvents(user?.role, user?.companyId)
  const [tab, setTab] = useState<EventDetailTab>('overview')
  const [detail, setDetail] = useState<CompanyEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ initialStep: EventWizardStep } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await eventsApi.get(eventId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  if (
    user &&
    !canAccessCompanySession(user.role, user.companyId) &&
    !isPersonalCalendarSession(user.role, user.companyId)
  ) {
    return <Redirect href="/" />
  }

  const isDuration = detail?.timeMode === 'duration'
  const showAttendee = Boolean(
    isDuration || detail?.attendeeDisplayName || detail?.attendeeUserId,
  )
  const overviewGalleryImages = detail ? combineEventGalleryImages(detail) : []

  return (
    <FeatureScreen
      title={detail?.serviceName ?? 'Event'}
      description="Company calendar event details."
      onBack={() => router.push(CALENDAR_EVENTS_PATH as Href)}
      backLabel="Back"
    >
      {loading ? <Spinner label="Loading event…" /> : null}
      {!loading && error && !detail ? <Body className="text-destructive">{error}</Body> : null}

      {detail ? (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as EventDetailTab)}
          className={tabsPageClassName}
        >
          <TabsList aria-label="Event sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className={tabsPageContentClassName}>
            <View className="gap-6">
              {overviewGalleryImages.length > 0 ? (
                <Card className="p-2">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {overviewGalleryImages.map((image) => (
                        <ImagePreview
                          key={image.mediaId}
                          src={image.url}
                          alt={detail.serviceName}
                          className="h-40 w-40 rounded-md"
                        />
                      ))}
                    </View>
                  </ScrollView>
                </Card>
              ) : null}

              <EditableSectionCard
                title="Service"
                description="Catalog service for this event"
                canEdit={canEdit}
                onEdit={() => setDialog({ initialStep: 1 })}
              >
                <ReadOnlyField label="Name" value={detail.serviceName} />
                <ReadOnlyField label="Time mode" value={formatTimeModeLabel(detail.timeMode)} />
              </EditableSectionCard>

              <EditableSectionCard
                title="When"
                description={
                  isDuration
                    ? 'Date, start time, and optional recurrence'
                    : 'Weekdays, date range, and times'
                }
                canEdit={canEdit}
                onEdit={() => setDialog({ initialStep: isDuration ? 3 : 2 })}
              >
                {isDuration ? (
                  <>
                    <ReadOnlyField
                      label="Schedule"
                      value={formatRecurrenceLabel(detail.recurrence, {
                        startsOn: detail.startsOn,
                        weekdays: detail.weekdays,
                      })}
                    />
                    <ReadOnlyField
                      label={detail.recurrence === 'none' ? 'Date' : 'From'}
                      value={formatCalendarYmd(detail.startsOn)}
                    />
                    {detail.recurrence !== 'none' ? (
                      <ReadOnlyField
                        label="Until"
                        value={detail.recurrenceUntil ? formatCalendarYmd(detail.recurrenceUntil) : '—'}
                      />
                    ) : null}
                    <ReadOnlyField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
                  </>
                ) : (
                  <>
                    <ReadOnlyField
                      label="Weekdays"
                      value={
                        detail.weekdays.length > 0 ? formatWeekdaysLabel(detail.weekdays) : '—'
                      }
                    />
                    <ReadOnlyField label="From" value={formatCalendarYmd(detail.startsOn)} />
                    <ReadOnlyField
                      label="Until"
                      value={detail.recurrenceUntil ? formatCalendarYmd(detail.recurrenceUntil) : '—'}
                    />
                    <ReadOnlyField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
                  </>
                )}
              </EditableSectionCard>

              {showAttendee ? (
                <EditableSectionCard
                  title="Attendee"
                  description="Identity user attending this event"
                  canEdit={canEdit && isDuration}
                  onEdit={isDuration ? () => setDialog({ initialStep: 2 }) : undefined}
                >
                  <ReadOnlyField label="Name" value={detail.attendeeDisplayName ?? '—'} />
                  <ReadOnlyField label="Email" value={detail.attendeeEmail ?? '—'} />
                </EditableSectionCard>
              ) : null}

              <Card className="gap-3">
                <Subheading>Record</Subheading>
                <Muted>Event record metadata</Muted>
                <ReadOnlyField label="Created" value={formatDisplayDateTime(detail.createdAt)} />
                <ReadOnlyField label="Updated" value={formatDisplayDateTime(detail.updatedAt)} />
              </Card>
            </View>
          </TabsContent>

          <TabsContent value="upcoming" className={tabsPageContentClassName}>
            <EventSessionsList
              event={detail}
              listTab="upcoming"
              personalOnly={personal}
              canExpand={canEdit}
              onOpen={(occurrenceDate) =>
                router.push(sessionDetailPath(eventId, occurrenceDate) as Href)
              }
              onExpanded={() => void load()}
            />
          </TabsContent>

          <TabsContent value="past" className={tabsPageContentClassName}>
            <EventSessionsList
              event={detail}
              listTab="past"
              personalOnly={personal}
              canExpand={canEdit}
              onOpen={(occurrenceDate) =>
                router.push(sessionDetailPath(eventId, occurrenceDate) as Href)
              }
              onExpanded={() => void load()}
            />
          </TabsContent>
        </Tabs>
      ) : null}

      {dialog && canEdit ? (
        <EventFormDialog
          open
          id={eventId}
          initialStep={dialog.initialStep}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={(saved) => {
            setDetail(saved)
            setDialog(null)
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
