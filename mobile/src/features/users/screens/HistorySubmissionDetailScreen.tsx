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
} from '@/features/users/services/userHistoryApi'
import { userDetailPath, userHistoryTokenPath } from '@/features/users/utils/userPaths'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type HistorySubmissionDetailScreenProps = {
  userId: string
  submissionId: string
}

export function HistorySubmissionDetailScreen({
  userId,
  submissionId,
}: HistorySubmissionDetailScreenProps) {
  const { t } = useTranslation('users')
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
      setError(err instanceof Error ? err.message : t('errors.loadSubmissionFailed'))
    } finally {
      setLoading(false)
    }
  }, [submissionId, t])

  useEffect(() => {
    void load()
  }, [load])

  function handleBack() {
    if (detail?.sessionTokenId) {
      router.push(userHistoryTokenPath(userId, detail.sessionTokenId) as Href)
      return
    }
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.push(userDetailPath(userId, 'history') as Href)
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
        title={t('history.submissionTitle')}
        description={t('history.formCardDescription')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('loading.submission')} />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen
        title={t('history.submissionTitle')}
        description={t('history.submissionLoadError')}
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
      description={t('history.filledFor', { name: detail.subjectDisplayName })}
      onBack={handleBack}
      backLabel={tc('back')}
    >
      <View className="gap-6">
        <Card className="gap-3">
          <Subheading>{t('history.formCardTitle')}</Subheading>
          <Muted>{t('history.formCardDescription')}</Muted>
          <Button variant="outline" size="sm" onPress={openView}>
            {t('history.viewForm')}
          </Button>
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.contextTitle')}</Subheading>
          <Muted>{t('history.contextDescription')}</Muted>
          <ReadOnlyField label={t('history.subject')} value={detail.subjectDisplayName} />
          <ReadOnlyField label={t('history.filledByLabel')} value={detail.filledByDisplayName} />
          <ReadOnlyField label={t('history.service')} value={detail.serviceName ?? '—'} />
          <ReadOnlyField
            label={t('history.submitted')}
            value={formatDisplayDateTime(detail.createdAt)}
          />
        </Card>
      </View>
    </FeatureScreen>
  )
}
