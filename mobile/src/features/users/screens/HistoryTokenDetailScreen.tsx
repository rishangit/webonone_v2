import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  ReadOnlyField,
  Spinner,
  Subheading,
} from '@webonone/mobile-ui'
import { TokenWorkflowProgress } from '@/features/users/components/TokenWorkflowProgress'
import {
  buildDesignFormWebViewPath,
  getSessionTokenHistoryDetail,
  listSubmissionsForSessionToken,
  type FormSubmissionDetail,
  type SessionTokenHistoryDetail,
} from '@/features/users/services/userHistoryApi'
import { userDetailPath, userHistorySalePath } from '@/features/users/utils/userPaths'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

type HistoryTokenDetailScreenProps = {
  userId: string
  tokenId: string
}

export function HistoryTokenDetailScreen({ userId, tokenId }: HistoryTokenDetailScreenProps) {
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const [detail, setDetail] = useState<SessionTokenHistoryDetail | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmissionDetail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextDetail, nextSubs] = await Promise.all([
        getSessionTokenHistoryDetail(tokenId),
        listSubmissionsForSessionToken(tokenId),
      ])
      setDetail(nextDetail)
      setSubmissions(nextSubs)
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : t('errors.loadHistoryDetailFailed'))
    } finally {
      setLoading(false)
    }
  }, [tokenId, t])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  function handleBack() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.push(userDetailPath(userId, 'history') as Href)
  }

  const primarySubmission = submissions[0] ?? null
  const formTemplateId = primarySubmission?.formTemplateId ?? detail?.formTemplateId ?? null

  function openFill() {
    if (!detail || !formTemplateId) return
    router.push(
      buildDesignFormWebViewPath({
        formTemplateId,
        subjectUserId: detail.userId,
        subjectDisplayName: detail.userDisplayName,
        subjectEmail: detail.userEmail,
        serviceId: detail.serviceId,
        serviceName: detail.serviceName,
        eventId: detail.eventId,
        occurrenceDate: detail.occurrenceDate,
        sessionTokenId: detail.tokenId,
        mode: 'fill',
      }) as Href,
    )
  }

  function openView() {
    if (!detail || !primarySubmission) return
    router.push(
      buildDesignFormWebViewPath({
        formTemplateId: primarySubmission.formTemplateId,
        subjectUserId: primarySubmission.subjectUserId,
        subjectDisplayName: primarySubmission.subjectDisplayName,
        subjectEmail: primarySubmission.subjectEmail,
        serviceId: primarySubmission.serviceId ?? detail.serviceId,
        serviceName: primarySubmission.serviceName ?? detail.serviceName,
        eventId: primarySubmission.eventId ?? detail.eventId,
        occurrenceDate: primarySubmission.occurrenceDate ?? detail.occurrenceDate,
        sessionTokenId: primarySubmission.sessionTokenId ?? detail.tokenId,
        mode: 'view',
        submissionId: primarySubmission.id,
      }) as Href,
    )
  }

  if (loading && !detail) {
    return (
      <FeatureScreen
        title={t('history.sessionHistoryTitle')}
        description={t('history.sessionCardDescription')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('loading.history')} />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen
        title={t('history.sessionHistoryTitle')}
        description={t('history.sessionHistoryLoadError')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Body className="text-destructive">{error}</Body>
      </FeatureScreen>
    )
  }

  if (!detail) return null

  return (
    <FeatureScreen
      title={detail.serviceName}
      description={t('history.tokenDescription', {
        label: detail.tokenLabel,
        date: formatCalendarYmd(detail.occurrenceDate),
      })}
      onBack={handleBack}
      backLabel={tc('back')}
    >
      <View className="gap-6">
        <Card className="gap-3">
          <Subheading>{t('history.sessionCardTitle')}</Subheading>
          <Muted>{t('history.sessionCardDescription')}</Muted>
          <ReadOnlyField label={t('history.service')} value={detail.serviceName} />
          <ReadOnlyField label={t('history.date')} value={formatCalendarYmd(detail.occurrenceDate)} />
          <ReadOnlyField label={t('history.time')} value={`${detail.startTime}–${detail.endTime}`} />
          <ReadOnlyField label={t('history.token')} value={detail.tokenLabel} />
          {detail.workflowProgress ? (
            <View className="gap-1">
              <Muted className="text-xs uppercase tracking-wide">{t('history.progress')}</Muted>
              <TokenWorkflowProgress progress={detail.workflowProgress} />
            </View>
          ) : null}
          <ReadOnlyField label={t('history.status')} value={detail.status} />
          <ReadOnlyField label={t('history.customer')} value={detail.userDisplayName} />
          {detail.spaceName ? (
            <ReadOnlyField label={t('history.space')} value={detail.spaceName} />
          ) : null}
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.formCardTitle')}</Subheading>
          <Muted>{t('history.formCardSessionDescription')}</Muted>
          {!formTemplateId ? (
            <Muted>{t('empty.noFormLinked')}</Muted>
          ) : primarySubmission ? (
            <Button variant="outline" size="sm" onPress={openView}>
              {t('history.viewForm')}
            </Button>
          ) : (
            <Button size="sm" onPress={openFill}>
              {t('history.fillForm')}
            </Button>
          )}
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.salesCardTitle')}</Subheading>
          <Muted>{t('history.salesCardDescription')}</Muted>
          {detail.sales.length === 0 ? (
            <ItemListEmpty>{t('history.salesEmpty')}</ItemListEmpty>
          ) : (
            <ItemList className="py-0">
              {detail.sales.map((sale) => (
                <ItemListItem
                  key={sale.id}
                  onPress={() => router.push(userHistorySalePath(userId, sale.id) as Href)}
                >
                  <ItemListContent
                    title={sale.billNumber}
                    subtitle={`${sale.currency} ${sale.total.toFixed(2)} · ${sale.paymentMethod}`}
                  />
                </ItemListItem>
              ))}
            </ItemList>
          )}
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.staffTitle')}</Subheading>
          <Muted>{t('history.staffDescription')}</Muted>
          <ReadOnlyField label={t('history.staffName')} value={detail.staffDisplayName} />
        </Card>
      </View>
    </FeatureScreen>
  )
}
