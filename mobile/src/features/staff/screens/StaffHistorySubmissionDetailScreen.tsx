import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Muted,
  ReadOnlyField,
  Spinner,
  Subheading,
} from '@webonone/mobile-ui'
import {
  buildDesignFormWebViewPath,
  getFormSubmissionDetail,
  type FormSubmissionDetail,
} from '@/features/staff/services/staffHistoryApi'
import { staffDetailPath, staffHistoryTokenPath } from '@/features/staff/utils/staffPaths'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type StaffHistorySubmissionDetailScreenProps = {
  staffId: string
  submissionId: string
}

export function StaffHistorySubmissionDetailScreen({
  staffId,
  submissionId,
}: StaffHistorySubmissionDetailScreenProps) {
  const { t } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const [detail, setDetail] = useState<FormSubmissionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await getFormSubmissionDetail(submissionId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : t('history.submissionDetail.unableToLoad'))
    } finally {
      setLoading(false)
    }
  }, [submissionId, t])

  useEffect(() => {
    void load()
  }, [load])

  function handleBack() {
    if (detail?.sessionTokenId) {
      router.push(staffHistoryTokenPath(staffId, detail.sessionTokenId) as Href)
      return
    }
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.push(staffDetailPath(staffId, 'history') as Href)
  }

  function openView() {
    if (!detail) return
    router.push(
      buildDesignFormWebViewPath({
        formTemplateId: detail.formTemplateId,
        subjectUserId: detail.subjectUserId,
        subjectDisplayName: detail.subjectDisplayName,
        subjectEmail: detail.subjectEmail,
        serviceId: detail.serviceId,
        serviceName: detail.serviceName,
        eventId: detail.eventId,
        occurrenceDate: detail.occurrenceDate,
        sessionTokenId: detail.sessionTokenId,
        mode: 'view',
        submissionId: detail.id,
      }) as Href,
    )
  }

  if (loading && !detail) {
    return (
      <FeatureScreen
        title={t('history.submissionDetail.title')}
        description={t('history.submissionDetail.answersDescription')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('history.submissionDetail.loading')} />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen
        title={t('history.submissionDetail.title')}
        description={t('history.submissionDetail.unableToLoad')}
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
      title={detail.formName}
      description={t('history.submissionDetail.filledFor', { name: detail.subjectDisplayName })}
      onBack={handleBack}
      backLabel={tc('back')}
    >
      <View className="gap-6">
        <Card className="gap-3">
          <Subheading>{t('history.submissionDetail.answersTitle')}</Subheading>
          <Muted>{t('history.submissionDetail.answersDescription')}</Muted>
          <Button variant="outline" size="sm" onPress={openView}>
            {t('history.submissionDetail.viewForm')}
          </Button>
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.submissionDetail.contextTitle')}</Subheading>
          <Muted>{t('history.submissionDetail.contextDescription')}</Muted>
          <ReadOnlyField label={t('history.submissionDetail.subject')} value={detail.subjectDisplayName} />
          <ReadOnlyField
            label={t('history.submissionDetail.filledBy')}
            value={detail.filledByDisplayName}
          />
          <ReadOnlyField
            label={t('history.submissionDetail.service')}
            value={detail.serviceName ?? '—'}
          />
          <ReadOnlyField
            label={t('history.submissionDetail.submitted')}
            value={formatDisplayDateTime(detail.createdAt)}
          />
        </Card>
      </View>
    </FeatureScreen>
  )
}
