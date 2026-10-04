import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { ArticleBody } from '@/features/docs/components/ArticleBody'
import type { FeedbackSpecDocFileName } from '@/features/feedback/services/feedbackApi'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'

const ALLOWED_FILES = new Set<FeedbackSpecDocFileName>([
  'spec.md',
  'plan.md',
  'development-summary.md',
])

function isSpecDocFileName(value: string): value is FeedbackSpecDocFileName {
  return ALLOWED_FILES.has(value as FeedbackSpecDocFileName)
}

export function FeedbackSpecDocPage() {
  const { t } = useTranslation('feedback')
  const { ticketNumber = '', fileName = '' } = useParams<{
    ticketNumber: string
    fileName: string
  }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { specDoc, specDocStatus, specDocError, specDocKey } = useAppSelector((s) => s.feedback)

  const validFile = isSpecDocFileName(fileName)
  const expectedKey = validFile ? `${ticketNumber}:${fileName}` : null
  const doc = expectedKey && specDocKey === expectedKey ? specDoc : null
  const loading = validFile && specDocStatus === 'loading' && !doc

  useEffect(() => {
    if (!accessToken || !ticketNumber || !validFile) return
    dispatch(feedbackActions.fetchSpecDocRequested({ ticketNumber, fileName }))
  }, [accessToken, dispatch, fileName, ticketNumber, validFile])

  useEffect(() => {
    return () => {
      dispatch(feedbackActions.clearSpecDoc())
    }
  }, [dispatch])

  const titleKey =
    fileName === 'spec.md'
      ? 'specDoc.spec'
      : fileName === 'plan.md'
        ? 'specDoc.plan'
        : fileName === 'development-summary.md'
          ? 'specDoc.developmentSummary'
          : 'specDoc.unknown'

  return (
    <FeaturePage
      title={
        ticketNumber
          ? t('specDoc.pageTitle', { ticket: ticketNumber, doc: t(titleKey) })
          : t('specDoc.pageTitleFallback')
      }
      description={t('specDoc.pageDescription')}
      onBack={() => navigate(`/feedback/${ticketNumber}`)}
      backLabel={t('common:back')}
    >
      {!validFile ? (
        <Alert variant="destructive">
          <AlertDescription>{t('specDoc.invalidFile')}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {validFile && specDocError && !doc ? (
        <Alert variant="destructive">
          <AlertDescription>{specDocError}</AlertDescription>
        </Alert>
      ) : null}

      {doc ? <ArticleBody markdown={doc.markdown} /> : null}
    </FeaturePage>
  )
}
