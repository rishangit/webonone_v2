import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ticket } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { IssueTokenDialog } from '@/features/catalog/components/IssueTokenDialog'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import {
  isCatalogKind,
  type CatalogDetailItem,
  type CatalogSessionItem,
} from '@/features/catalog/types/catalog.types'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { CatalogDetailImageCarousel } from '@/features/website/components/CatalogDetailImageCarousel'
import { CatalogSearchMapView } from '@/features/website/components/CatalogSearchMapView'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'
import { useUserLocation } from '@/features/website/hooks/useUserLocation'
import { getWebOnOneLoginUrl } from '@/features/webonone/utils/webononeConfig'

const KIND_LABEL: Record<CatalogDetailItem['kind'], string> = {
  products: 'Product',
  services: 'Service',
  spaces: 'Space',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`
  }
  return `${distanceKm.toFixed(1)} km away`
}

function hasMapLocation(item: CatalogDetailItem): boolean {
  return (
    item.latitude != null &&
    item.longitude != null &&
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  )
}

function hasServiceTime(item: CatalogDetailItem): boolean {
  return item.kind === 'services' && (item.timeMode === 'window' || item.timeMode === 'duration')
}

function formatOccurrenceDate(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function weekdayLabel(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return DAY_LABELS[date.getDay()] ?? `D${date.getDay()}`
}

function detailImages(item: CatalogDetailItem) {
  if (item.galleryImages.length > 0) {
    return item.galleryImages
  }
  if (item.imageUrl) {
    return [{ mediaId: 'cover', url: item.imageUrl }]
  }
  return []
}

type BookingTarget = {
  eventId: string
  occurrenceDate: string
}

export function CatalogDetailPage() {
  const { kind: kindParam = '', id = '' } = useParams()
  const navigate = useNavigate()
  const kind = isCatalogKind(kindParam) ? kindParam : null
  const { user, accessToken, isAuthenticated } = useWebsiteAuth()
  const {
    coords,
    placeLabel,
    status: locationStatus,
    source: locationSource,
    permissionDenied,
    showPermissionPrompt,
    requestLocation,
    openPermissionPrompt,
    dismissPermissionPrompt,
  } = useUserLocation()

  const [item, setItem] = useState<CatalogDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [sessions, setSessions] = useState<CatalogSessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null)

  useEffect(() => {
    if (!kind || !id.trim()) {
      setLoading(false)
      setNotFound(true)
      setItem(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    void catalogApi
      .getById(kind, id.trim(), coords ? { lat: coords.lat, lng: coords.lng } : undefined)
      .then((detail) => {
        if (cancelled) return
        setItem(detail)
        setLoading(false)
      })
      .catch((err: Error & { statusCode?: number }) => {
        if (cancelled) return
        if (err.statusCode === 404) {
          setNotFound(true)
          setError(null)
        } else {
          setNotFound(false)
          setError(err.message || 'Failed to load catalog item')
        }
        setItem(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, id, coords?.lat, coords?.lng])

  useEffect(() => {
    if (!item || item.kind !== 'services' || item.timeMode !== 'window') {
      setSessions([])
      setSessionsError(null)
      setSessionsLoading(false)
      return
    }

    let cancelled = false
    setSessionsLoading(true)
    setSessionsError(null)

    void catalogApi
      .listSessions(item.id)
      .then((items) => {
        if (cancelled) return
        setSessions(items)
        setSessionsLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSessions([])
        setSessionsError(err.message || 'Failed to load sessions')
        setSessionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [item])

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
  }

  function handleGetToken(session: CatalogSessionItem) {
    if (!item || !isAuthenticated || !accessToken || !user) {
      window.location.href = getWebOnOneLoginUrl(
        `/catalog/${encodeURIComponent(item?.kind ?? 'services')}/${encodeURIComponent(item?.id ?? id)}`,
      )
      return
    }
    setBookingTarget({
      eventId: session.eventId,
      occurrenceDate: session.occurrenceDate,
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <WebsiteHeader className="shrink-0 z-20" />

      <LocationPermissionDialog
        open={showPermissionPrompt}
        blocked={permissionDenied}
        onAllow={requestLocation}
        onNotNow={dismissPermissionPrompt}
      />

      {item && bookingTarget && accessToken && user ? (
        <IssueTokenDialog
          open={Boolean(bookingTarget)}
          serviceId={item.id}
          eventId={bookingTarget.eventId}
          occurrenceDate={bookingTarget.occurrenceDate}
          accessToken={accessToken}
          user={user}
          onOpenChange={(open) => {
            if (!open) setBookingTarget(null)
          }}
        />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 shrink-0 bg-background px-4 pt-2 sm:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleBack}
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
            </div>

            <CurrentLocationBar
              coords={coords}
              placeLabel={placeLabel}
              status={locationStatus}
              source={locationSource}
              permissionDenied={permissionDenied}
              showPermissionPrompt={showPermissionPrompt}
              onOpenPermissionPrompt={openPermissionPrompt}
              onRetry={requestLocation}
            />
          </div>
        </div>

        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-12 sm:px-8">
          <div className="mx-auto w-full max-w-5xl pt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : notFound ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Not found</CardTitle>
                  <CardDescription>
                    This offering is unavailable or no longer listed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/search">Back to search</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Something went wrong</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/search">Back to search</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : item ? (
              <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Overview</CardTitle>
                      <CardDescription>Basic details for this offering.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CatalogDetailImageCarousel images={detailImages(item)} alt={item.name} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {KIND_LABEL[item.kind]}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                          {item.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">{item.companyName}</p>
                      </div>
                      {item.description ? (
                        <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No description provided.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1.5">
                          <CardTitle className="text-lg">Location</CardTitle>
                          <CardDescription>
                            {hasMapLocation(item)
                              ? item.companyName
                              : 'No map pin is available for this offering.'}
                          </CardDescription>
                        </div>
                        {item.distanceKm != null ? (
                          <span className="rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
                            {formatDistanceKm(item.distanceKm)}
                          </span>
                        ) : locationStatus === 'ready' && !hasMapLocation(item) ? (
                          <span className="text-xs text-muted-foreground">No map pin</span>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent
                      className={hasMapLocation(item) ? 'overflow-hidden rounded-b-lg p-0' : undefined}
                    >
                      {hasMapLocation(item) ? (
                        <CatalogSearchMapView
                          items={[item]}
                          userCoords={coords}
                          variant="embedded"
                          focusKey={`${item.kind}-${item.id}`}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This company has not set a map location yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                  {hasServiceTime(item) ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Time</CardTitle>
                        <CardDescription>How this service is scheduled.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Time mode</p>
                          <p className="text-sm text-foreground">
                            {item.timeMode === 'window' ? 'Specific time' : 'Duration'}
                          </p>
                        </div>
                        {item.timeMode === 'duration' ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Duration</p>
                            <p className="text-sm text-foreground">
                              {item.durationMinutes != null
                                ? `${String(item.durationMinutes)} minutes`
                                : '—'}
                            </p>
                          </div>
                        ) : null}
                        {item.timeMode === 'window' ? (
                          <>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Start time
                              </p>
                              <p className="text-sm text-foreground">{item.startTime ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">End time</p>
                              <p className="text-sm text-foreground">{item.endTime ?? '—'}</p>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                        <CardDescription>Categories linked to this offering.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                              style={
                                tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                              }
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {item.kind === 'services' && item.timeMode === 'window' ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sessions</CardTitle>
                        <CardDescription>
                          Book a queue token for an upcoming Specific time session.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sessionsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading sessions…</p>
                        ) : sessionsError ? (
                          <p className="text-sm text-destructive">{sessionsError}</p>
                        ) : sessions.length === 0 ? (
                          <ItemListEmpty>No upcoming sessions for this service.</ItemListEmpty>
                        ) : (
                          <ItemList>
                            {sessions.map((session) => (
                              <ItemListItem
                                key={`${session.eventId}-${session.occurrenceDate}`}
                              >
                                <ItemListContent>
                                  <div className="flex w-full flex-col gap-2">
                                    <div className="min-w-0 space-y-1">
                                      <p className="truncate font-medium text-foreground">
                                        {formatOccurrenceDate(session.occurrenceDate)}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {weekdayLabel(session.occurrenceDate)} ·{' '}
                                        {session.startTime}–{session.endTime}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="w-full gap-1.5"
                                      onClick={() => handleGetToken(session)}
                                    >
                                      <Ticket className="size-3.5" aria-hidden />
                                      Get the token
                                    </Button>
                                  </div>
                                </ItemListContent>
                              </ItemListItem>
                            ))}
                          </ItemList>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
