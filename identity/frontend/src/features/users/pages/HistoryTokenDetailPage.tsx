import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  ItemListEmpty,
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useOpenDesignFormDialog } from '@/features/users/hooks/useOpenDesignFormDialog'
import {
  getSessionTokenHistoryDetail,
  listSubmissionsForSessionToken,
  type FormSubmissionDetail,
  type SessionTokenHistoryDetail,
} from '@/features/users/services/userHistoryApi'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function formatOccurrenceDate(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function HistoryTokenDetailPage() {
  const { t } = useTranslation('users')
  const { id: userId, tokenId } = useParams<{ id: string; tokenId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SessionTokenHistoryDetail | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmissionDetail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reloadSubmissions = useCallback(() => {
    if (!tokenId) return
    listSubmissionsForSessionToken(tokenId)
      .then(setSubmissions)
      .catch(() => {
        /* keep existing submissions on soft refresh failure */
      })
  }, [tokenId])

  const { open: openFormDialog } = useOpenDesignFormDialog(reloadSubmissions)

  usePlatformLoading(loading && !detail ? t('loadingHistory') : null)

  useEffect(() => {
    if (!tokenId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getSessionTokenHistoryDetail(tokenId), listSubmissionsForSessionToken(tokenId)])
      .then(([nextDetail, nextSubs]) => {
        if (cancelled) return
        setDetail(nextDetail)
        setSubmissions(nextSubs)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('unableToLoadHistoryDetail'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tokenId])

  const backToUser = () => {
    if (userId) navigate(`/users/${userId}?tab=history`)
    else navigate('/users')
  }

  if (loading && !detail) return null

  if (error && !detail) {
    return (
      <FeaturePage
        title={t('sessionHistory')}
        description={t('unableToLoadSessionHistory')}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={backToUser}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('common:back')}
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail) return null

  const primarySubmission = submissions[0] ?? null
  const formTemplateId = primarySubmission?.formTemplateId ?? detail.formTemplateId

  function openFill() {
    if (!formTemplateId) return
    openFormDialog({
      formTemplateId,
      subjectUserId: detail!.userId,
      subjectDisplayName: detail!.userDisplayName,
      subjectEmail: detail!.userEmail,
      serviceId: detail!.serviceId,
      serviceName: detail!.serviceName,
      eventId: detail!.eventId,
      occurrenceDate: detail!.occurrenceDate,
      sessionTokenId: detail!.tokenId,
      mode: 'fill',
    })
  }

  function openView() {
    if (!primarySubmission) return
    openFormDialog({
      formTemplateId: primarySubmission.formTemplateId,
      subjectUserId: primarySubmission.subjectUserId,
      subjectDisplayName: primarySubmission.subjectDisplayName,
      subjectEmail: primarySubmission.subjectEmail,
      serviceId: primarySubmission.serviceId ?? detail!.serviceId,
      serviceName: primarySubmission.serviceName ?? detail!.serviceName,
      eventId: primarySubmission.eventId ?? detail!.eventId,
      occurrenceDate: primarySubmission.occurrenceDate ?? detail!.occurrenceDate,
      sessionTokenId: primarySubmission.sessionTokenId ?? detail!.tokenId,
      mode: 'view',
      submissionId: primarySubmission.id,
    })
  }

  return (
    <FeaturePage
      title={detail.serviceName}
      description={t('tokenPrefix', { label: detail.tokenLabel, date: formatOccurrenceDate(detail.occurrenceDate) })}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={backToUser}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('common:back')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('session')}</CardTitle>
              <CardDescription>{t('sessionCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label={t('service')} value={detail.serviceName} />
              <DetailField label={t('date')} value={formatOccurrenceDate(detail.occurrenceDate)} />
              <DetailField label={t('time')} value={`${detail.startTime}–${detail.endTime}`} />
              <DetailField label={t('token')} value={detail.tokenLabel} />
              <DetailField label={t('status')} value={detail.status} />
              <DetailField label={t('customer')} value={detail.userDisplayName} />
              {detail.spaceName ? <DetailField label={t('space')} value={detail.spaceName} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('form')}</CardTitle>
              <CardDescription>{t('formCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!formTemplateId ? (
                <ItemListEmpty>{t('noFormLinked')}</ItemListEmpty>
              ) : primarySubmission ? (
                <Button type="button" size="sm" variant="outline" onClick={openView}>
                  {t('viewForm')}
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={openFill}>
                  {t('fillForm')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('staff')}</CardTitle>
              <CardDescription>{t('staffCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label={t('name')} value={detail.staffDisplayName} />
            </CardContent>
          </Card>
        </div>
      </div>
    </FeaturePage>
  )
}
