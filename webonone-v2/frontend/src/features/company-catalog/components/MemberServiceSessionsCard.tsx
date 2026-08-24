import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ticket } from 'lucide-react'
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
import { useAppSelector } from '@/app/store/hooks'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import { MemberIssueTokenDialog } from './MemberIssueTokenDialog'
import { companyCatalogApi } from '../services/companyCatalogApi'
import type { CatalogSessionItem, CatalogSessionTokenItem } from '../types/companyCatalog.types'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function formatOccurrenceDate(ymd: string, locale: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return date.toLocaleDateString(locale === 'si' ? 'si-LK' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function weekdayLabel(ymd: string, t: (key: string) => string): string {
  const date = new Date(`${ymd}T12:00:00`)
  const key = DAY_KEYS[date.getDay()]
  return key ? t(`detail.sessions.weekdays.${key}`) : `D${date.getDay()}`
}

export type MemberServiceSessionsCardProps = {
  companyId: string
  serviceId: string
}

export function MemberServiceSessionsCard({
  companyId,
  serviceId,
}: MemberServiceSessionsCardProps) {
  const { t, i18n } = useTranslation('catalog')
  const user = useAppSelector((s) => s.auth.user)
  const [sessions, setSessions] = useState<CatalogSessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [tokensBySessionKey, setTokensBySessionKey] = useState<
    Record<string, CatalogSessionTokenItem>
  >({})
  const [bookingTarget, setBookingTarget] = useState<{
    eventId: string
    occurrenceDate: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    setSessionsLoading(true)
    setSessionsError(null)

    void companyCatalogApi
      .listSessionsForCompany(companyId, serviceId)
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
        setSessionsError(err.message || t('detail.sessions.failedLoadSessions'))
        setSessionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [companyId, serviceId, t])

  useEffect(() => {
    if (!user || sessions.length === 0) {
      setTokensBySessionKey({})
      return
    }

    let cancelled = false
    void Promise.all(
      sessions.map(async (session) => {
        const token = await companyCatalogApi.getMyToken(
          companyId,
          serviceId,
          session.eventId,
          session.occurrenceDate,
        )
        return { session, token }
      }),
    )
      .then((results) => {
        if (cancelled) return
        const next: Record<string, CatalogSessionTokenItem> = {}
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
  }, [companyId, serviceId, sessions, user])

  const sessionSpaces = useMemo(() => {
    const byId = new Map<string, string>()
    for (const session of sessions) {
      if (session.spaceId && session.spaceName?.trim()) {
        byId.set(session.spaceId, session.spaceName.trim())
      }
    }
    return [...byId.entries()].map(([spaceId, spaceName]) => ({ spaceId, spaceName }))
  }, [sessions])

  function handleGetToken(session: CatalogSessionItem) {
    if (!user) return
    setBookingTarget({
      eventId: session.eventId,
      occurrenceDate: session.occurrenceDate,
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.sessions.where')}</CardTitle>
          <CardDescription>{t('detail.sessions.whereDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">{t('detail.sessions.loadingDetails')}</p>
          ) : sessionSpaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('detail.sessions.noSpaceYet')}</p>
          ) : (
            sessionSpaces.map((space) => (
              <div key={space.spaceId}>
                <p className="text-xs font-medium text-muted-foreground">
                  {t('detail.sessions.space')}
                </p>
                <p className="text-sm text-foreground">{space.spaceName}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.sessions.title')}</CardTitle>
          <CardDescription>{t('detail.sessions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">{t('detail.sessions.loadingSessions')}</p>
          ) : sessionsError ? (
            <p className="text-sm text-destructive">{sessionsError}</p>
          ) : sessions.length === 0 ? (
            <ItemListEmpty>{t('detail.sessions.noSessions')}</ItemListEmpty>
          ) : (
            <ItemList>
              {sessions.map((session) => {
                const token = tokensBySessionKey[sessionKey(session.eventId, session.occurrenceDate)]
                return (
                <ItemListItem key={`${session.eventId}-${session.occurrenceDate}`}>
                  <ItemListContent>
                    <div className="flex w-full flex-col gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium text-foreground">
                          {formatOccurrenceDate(session.occurrenceDate, i18n.language)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {weekdayLabel(session.occurrenceDate, t)} · {session.startTime}–
                          {session.endTime}
                          {session.spaceName?.trim() ? ` · ${session.spaceName.trim()}` : ''}
                        </p>
                        <SessionScheduleChangeMeta
                          scheduleChanged={session.scheduleChanged}
                          scheduleChangeKind={session.scheduleChangeKind}
                          originalStartTime={session.originalStartTime}
                          originalEndTime={session.originalEndTime}
                        />
                      </div>
                      {token ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                              {t('detail.sessions.alreadyBooked')}
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
                        {t('detail.sessions.getToken')}
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

      {user && bookingTarget ? (
        <MemberIssueTokenDialog
          open={Boolean(bookingTarget)}
          companyId={companyId}
          serviceId={serviceId}
          eventId={bookingTarget.eventId}
          occurrenceDate={bookingTarget.occurrenceDate}
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
    </>
  )
}

function sessionKey(eventId: string, occurrenceDate: string): string {
  return `${eventId}:${occurrenceDate}`
}
