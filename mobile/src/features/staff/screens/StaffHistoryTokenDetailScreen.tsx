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
} from '@/features/staff/services/staffHistoryApi'
import { staffDetailPath } from '@/features/staff/utils/staffPaths'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

type StaffHistoryTokenDetailScreenProps = {
  staffId: string
  tokenId: string
}

export function StaffHistoryTokenDetailScreen({
  staffId,
  tokenId,
}: StaffHistoryTokenDetailScreenProps) {
  const { t } = useTranslation('staff')
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
      setError(err instanceof Error ? err.message : t('history.tokenDetail.unableToLoad'))
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
    router.push(staffDetailPath(staffId, 'history') as Href)
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

  function openView(submission: FormSubmissionDetail) {
    router.push(
      buildDesignFormWebViewPath({
        formTemplateId: submission.formTemplateId,
        subjectUserId: submission.subjectUserId,
        subjectDisplayName: submission.subjectDisplayName,
        subjectEmail: submission.subjectEmail,
        serviceId: submission.serviceId ?? detail?.serviceId ?? null,
        serviceName: submission.serviceName ?? detail?.serviceName ?? null,
        eventId: submission.eventId ?? detail?.eventId ?? null,
        occurrenceDate: submission.occurrenceDate ?? detail?.occurrenceDate ?? null,
        sessionTokenId: submission.sessionTokenId ?? detail?.tokenId ?? null,
        mode: 'view',
        submissionId: submission.id,
      }) as Href,
    )
  }

  if (loading && !detail) {
    return (
      <FeatureScreen
        title={t('history.tokenDetail.title')}
        description={t('history.tokenDetail.sessionDescription')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('history.tokenDetail.loading')} />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen
        title={t('history.tokenDetail.title')}
        description={t('history.tokenDetail.unableToLoad')}
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
      description={t('history.tokenDetail.tokenSubtitle', {
        label: detail.tokenLabel,
        date: formatCalendarYmd(detail.occurrenceDate),
      })}
      onBack={handleBack}
      backLabel={tc('back')}
    >
      <View className="gap-6">
        <Card className="gap-3">
          <Subheading>{t('history.tokenDetail.sessionTitle')}</Subheading>
          <Muted>{t('history.tokenDetail.sessionDescription')}</Muted>
          <ReadOnlyField label={t('history.tokenDetail.service')} value={detail.serviceName} />
          <ReadOnlyField
            label={t('history.tokenDetail.date')}
            value={formatCalendarYmd(detail.occurrenceDate)}
          />
          <ReadOnlyField
            label={t('history.tokenDetail.time')}
            value={`${detail.startTime}–${detail.endTime}`}
          />
          <ReadOnlyField label={t('history.tokenDetail.token')} value={detail.tokenLabel} />
          {detail.workflowProgress ? (
            <View className="gap-1">
              <Muted className="text-xs uppercase tracking-wide">{t('history.tokenDetail.status')}</Muted>
              <TokenWorkflowProgress progress={detail.workflowProgress} />
            </View>
          ) : null}
          <ReadOnlyField label={t('history.tokenDetail.status')} value={detail.status} />
          <ReadOnlyField label={t('history.tokenDetail.customer')} value={detail.userDisplayName} />
          {detail.spaceName ? (
            <ReadOnlyField label={t('history.tokenDetail.space')} value={detail.spaceName} />
          ) : null}
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.tokenDetail.filledFormsTitle')}</Subheading>
          <Muted>{t('history.tokenDetail.filledFormsDescription')}</Muted>
          {submissions.length === 0 ? (
            !formTemplateId ? (
              <Muted>{t('history.tokenDetail.noForms')}</Muted>
            ) : (
              <Button size="sm" onPress={openFill}>
                {t('history.tokenDetail.fillForm')}
              </Button>
            )
          ) : (
            submissions.map((submission) => (
              <Button
                key={submission.id}
                variant="outline"
                size="sm"
                onPress={() => openView(submission)}
              >
                {submission.formName}
              </Button>
            ))
          )}
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.tokenDetail.salesTitle')}</Subheading>
          <Muted>{t('history.tokenDetail.salesDescription')}</Muted>
          {detail.sales.length === 0 ? (
            <ItemListEmpty>{t('history.tokenDetail.salesEmpty')}</ItemListEmpty>
          ) : (
            <ItemList className="py-0">
              {detail.sales.map((sale) => (
                <ItemListItem
                  key={sale.id}
                  onPress={() => router.push(`/sales/${sale.id}` as Href)}
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
          <Subheading>{t('history.tokenDetail.staffTitle')}</Subheading>
          <Muted>{t('history.tokenDetail.staffDescription')}</Muted>
          <ReadOnlyField label={t('history.tokenDetail.name')} value={detail.staffDisplayName} />
        </Card>
      </View>
    </FeatureScreen>
  )
}
