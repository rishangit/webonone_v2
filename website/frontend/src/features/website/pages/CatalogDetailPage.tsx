import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Ticket } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  ImageCarousel,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { LoginRequiredDialog } from '@/features/auth/components/LoginRequiredDialog'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { IssueTokenDialog } from '@/features/catalog/components/IssueTokenDialog'
import { TokenWorkflowProgress } from '@/features/catalog/components/TokenWorkflowProgress'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import {
  isCatalogKind,
  type CatalogDetailItem,
  type CatalogSessionItem,
  type SessionTokenItem,
} from '@/features/catalog/types/catalog.types'
import { CatalogSearchMapView } from '@/features/website/components/CatalogSearchMapView'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { useUserLocation } from '@/features/website/hooks/useUserLocation'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

function kindLabel(kind: CatalogDetailItem['kind'], t: (key: string) => string): string {
  if (kind === 'products') return t('product')
  if (kind === 'services') return t('service')
  return t('spaceKind')
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function formatDistanceKm(
  distanceKm: number,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (distanceKm < 1) {
    return t('metersAway', { meters: String(Math.round(distanceKm * 1000)) })
  }
  return t('kmAway', { km: distanceKm.toFixed(1) })
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

function weekdayLabel(ymd: string, t: (key: string) => string): string {
  const date = new Date(`${ymd}T12:00:00`)
  const key = DAY_KEYS[date.getDay()]
  return key ? t(key) : `D${date.getDay()}`
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
  const { t, i18n } = useTranslation('search')
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
  const [tokensBySessionKey, setTokensBySessionKey] = useState<Record<string, SessionTokenItem>>({})
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null)
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)

  const itemRef = useRef(item)
  itemRef.current = item

  const detailReturnPath = useMemo(() => {
    const kindSegment = encodeURIComponent(item?.kind ?? kind ?? 'services')
    const idSegment = encodeURIComponent(item?.id ?? id)
    return `/catalog/${kindSegment}/${idSegment}`
  }, [id, item?.id, item?.kind, kind])

  const sessionSpaces = useMemo(() => {
    const byId = new Map<string, string>()
    for (const session of sessions) {
      if (session.spaceId && session.spaceName?.trim()) {
        byId.set(session.spaceId, session.spaceName.trim())
      }
    }
    return [...byId.entries()].map(([spaceId, spaceName]) => ({ spaceId, spaceName }))
  }, [sessions])

  useEffect(() => {
    if (!kind || !id.trim()) {
      setLoading(false)
      setNotFound(true)
      setItem(null)
      setError(null)
      return
    }

    let cancelled = false
    const current = itemRef.current
    const softRefetch = current?.kind === kind && current.id === id.trim()
    if (!softRefetch) {
      setLoading(true)
    }
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
          setError(err.message || t('failedLoadItem'))
        }
        if (!softRefetch) {
          setItem(null)
        }
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
        setTokensBySessionKey({})
        setSessionsLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSessions([])
        setTokensBySessionKey({})
        setSessionsError(err.message || t('failedLoadSessions'))
        setSessionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [item])

  useEffect(() => {
    if (!item || !isAuthenticated || !accessToken || sessions.length === 0) {
      setTokensBySessionKey({})
      return
    }

    let cancelled = false
    void Promise.all(
      sessions.map(async (session) => {
        const token = await catalogApi.getMyToken(
          item.id,
          session.eventId,
          session.occurrenceDate,
          accessToken,
        )
        return { session, token }
      }),
    )
      .then((results) => {
        if (cancelled) return
        const next: Record<string, SessionTokenItem> = {}
        for (const { session, token } of results) {
          if (!token) continue
          next[sessionKey(session.eventId, session.occurrenceDate)] = token
        }
        setTokensBySessionKey(next)
      })
      .catch(() => {
        if (cancelled) return
      })

    return () => {
      cancelled = true
    }
  }, [item, isAuthenticated, accessToken, sessions])

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
  }

  function handleGetToken(session: CatalogSessionItem) {
    if (!item || !isAuthenticated || !accessToken || !user) {
      setLoginRequiredOpen(true)
      return
    }
    setBookingTarget({
      eventId: session.eventId,
      occurrenceDate: session.occurrenceDate,
    })
  }

  const pageTitle = item?.name
    ?? (notFound ? t('notFound') : error ? t('somethingWrong') : t('loadingDetails'))
  const pageDescription = item?.companyName
    ?? (notFound ? t('notFoundDescription') : error ?? undefined)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <LocationPermissionDialog
        open={showPermissionPrompt}
        blocked={permissionDenied}
        onAllow={requestLocation}
        onNotNow={dismissPermissionPrompt}
      />

      <LoginRequiredDialog
        open={loginRequiredOpen}
        onOpenChange={setLoginRequiredOpen}
        returnPath={detailReturnPath}
        description={t('loginRequired')}
      />

      {item && bookingTarget && accessToken && user ? (
        <IssueTokenDialog
          open={Boolean(bookingTarget)}
          serviceId={item.id}
          eventId={bookingTarget.eventId}
          occurrenceDate={bookingTarget.occurrenceDate}
          accessToken={accessToken}
          user={user}
          onIssued={(token) => {
            setTokensBySessionKey((prev) => ({
              ...prev,
              [sessionKey(token.eventId, token.occurrenceDate)]: token,
            }))
          }}
          onOpenChange={(open) => {
            if (!open) setBookingTarget(null)
          }}
        />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 shrink-0 bg-background px-4 pt-2 sm:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
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

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-12 sm:px-8">
          <FeaturePage
            title={pageTitle}
            description={pageDescription}
            onBack={handleBack}
            backLabel={t('back')}
            className="mx-auto w-full max-w-5xl px-0 py-4 sm:px-0 sm:pb-0 sm:pt-4"
          >
            {loading ? null : notFound ? (
              <Card>
                <CardContent className="pt-6">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/search">{t('backToSearch')}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to="/search">{t('backToSearch')}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : item ? (
              <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <ImageCarousel images={detailImages(item)} alt={item.name} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('overview')}</CardTitle>
                      <CardDescription>{t('overviewDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {kindLabel(item.kind, t)}
                        </span>
                      </div>
                      {item.description ? (
                        <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-foreground">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('noDescription')}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1.5">
                          <CardTitle className="text-lg">{t('location')}</CardTitle>
                          <CardDescription>
                            {hasMapLocation(item)
                              ? item.companyName
                              : t('noMapPinOffering')}
                          </CardDescription>
                        </div>
                        {item.distanceKm != null ? (
                          <span className="rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground">
                            {formatDistanceKm(item.distanceKm, t)}
                          </span>
                        ) : locationStatus === 'ready' && !hasMapLocation(item) ? (
                          <span className="text-xs text-muted-foreground">{t('noMapPin')}</span>
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
                          {t('noCompanyMap')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                  {hasServiceTime(item) ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('time')}</CardTitle>
                        <CardDescription>{t('timeScheduled')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('timeMode')}</p>
                          <p className="text-sm text-foreground">
                            {item.timeMode === 'window' ? t('specificTime') : t('duration')}
                          </p>
                        </div>
                        {item.timeMode === 'duration' ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{t('duration')}</p>
                            <p className="text-sm text-foreground">
                              {item.durationMinutes != null
                                ? t('durationMinutes', { minutes: String(item.durationMinutes) })
                                : '—'}
                            </p>
                          </div>
                        ) : null}
                        {item.timeMode === 'window' ? (
                          <>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                {t('startTime')}
                              </p>
                              <p className="text-sm text-foreground">{item.startTime ?? '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">{t('endTime')}</p>
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
                        <CardTitle className="text-lg">{t('tags')}</CardTitle>
                        <CardDescription>{t('tagsDescription')}</CardDescription>
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
                        <CardTitle className="text-lg">{t('where')}</CardTitle>
                        <CardDescription>
                          {t('whereDescription')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {sessionsLoading ? (
                          <p className="text-sm text-muted-foreground">{t('loadingDetails')}</p>
                        ) : sessionSpaces.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t('noSpaceYet')}
                          </p>
                        ) : (
                          sessionSpaces.map((space) => (
                            <div key={space.spaceId}>
                              <p className="text-xs font-medium text-muted-foreground">{t('space')}</p>
                              <p className="text-sm text-foreground">{space.spaceName}</p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                  {item.kind === 'services' && item.timeMode === 'window' ? (
                    <Card variant="list">
                      <CardHeader>
                        <CardTitle className="text-lg">{t('sessions')}</CardTitle>
                        <CardDescription>
                          {t('sessionsDescription')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sessionsLoading ? (
                          <p className="text-sm text-muted-foreground">{t('loadingSessions')}</p>
                        ) : sessionsError ? (
                          <p className="text-sm text-destructive">{sessionsError}</p>
                        ) : sessions.length === 0 ? (
                          <ItemListEmpty>{t('noSessions')}</ItemListEmpty>
                        ) : (
                          <ItemList className="py-0">
                            {sessions.map((session) => {
                              const token =
                                tokensBySessionKey[sessionKey(session.eventId, session.occurrenceDate)]
                              return (
                              <ItemListItem
                                key={`${session.eventId}-${session.occurrenceDate}`}
                              >
                                <ItemListContent>
                                  <div className="flex w-full flex-col gap-2">
                                    <div className="min-w-0 space-y-1">
                                      <p className="truncate font-medium text-foreground">
                                        {formatCalendarYmd(session.occurrenceDate, i18n.language)}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {weekdayLabel(session.occurrenceDate, t)} ·{' '}
                                        {session.startTime}–{session.endTime}
                                        {session.spaceName?.trim()
                                          ? ` · ${session.spaceName.trim()}`
                                          : ''}
                                      </p>
                                    </div>
                                    {token ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                                            {t('alreadyBooked')}
                                          </span>
                                          <span className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-sm font-bold tracking-wide text-primary shadow-sm">
                                            {token.tokenLabel}
                                          </span>
                                        </div>
                                        <TokenWorkflowProgress progress={token.workflowProgress} />
                                      </div>
                                    ) : null}
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="w-full gap-1.5"
                                      onClick={() => handleGetToken(session)}
                                    >
                                      <Ticket className="size-3.5" aria-hidden />
                                      {t('getToken')}
                                    </Button>
                                  </div>
                                </ItemListContent>
                              </ItemListItem>
                              )
                            })}
                          </ItemList>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>
            ) : null}
          </FeaturePage>
        </div>
      </div>
    </div>
  )
}

function sessionKey(eventId: string, occurrenceDate: string): string {
  return `${eventId}:${occurrenceDate}`
}
