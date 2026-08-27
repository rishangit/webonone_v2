import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import {
  getFormSubmissionDetail,
  type FormSubmissionDetail,
} from '@/features/staff/services/staffHistoryApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function formatAnswer(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(String).join(', ') || '—'
  if (typeof value === 'object') return JSON.stringify(value)
  const text = String(value).trim()
  return text || '—'
}

export function StaffHistorySubmissionDetailPage() {
  const { staffId, submissionId } = useParams<{ staffId: string; submissionId: string }>()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [detail, setDetail] = useState<FormSubmissionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  usePlatformLoading(loading && !detail ? 'Loading submission…' : null)

  useEffect(() => {
    if (!submissionId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getFormSubmissionDetail(submissionId)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load submission')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [submissionId])

  const back = () => {
    if (detail?.sessionTokenId && staffId) {
      navigate(`/staff/${staffId}/history/tokens/${detail.sessionTokenId}`)
      return
    }
    if (staffId) navigate(`/staff/${staffId}?tab=history`)
    else navigate('/staff')
  }

  if (loading && !detail) return null

  if (error && !detail) {
    return (
      <FeaturePage
        title="Form submission"
        description="Unable to load submission."
        onBack={back}
        backLabel="Back"
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail) return null

  const answerEntries = Object.entries(detail.answers ?? {})

  return (
    <FeaturePage
      title={detail.formName}
      description={`Filled for ${detail.subjectDisplayName}`}
      onBack={back}
      backLabel="Back"
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Answers</CardTitle>
              <CardDescription>Submitted form responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {answerEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No answers recorded.</p>
              ) : (
                answerEntries.map(([fieldId, value]) => (
                  <DetailField key={fieldId} label={fieldId} value={formatAnswer(value)} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Context</CardTitle>
              <CardDescription>Who filled this form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Subject" value={detail.subjectDisplayName} />
              <DetailField label="Filled by" value={detail.filledByDisplayName} />
              <DetailField label="Service" value={detail.serviceName ?? '—'} />
              <DetailField
                label="Submitted"
                value={formatLocaleDateTime(detail.createdAt, i18n.language)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </FeaturePage>
  )
}
