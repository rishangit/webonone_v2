import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useOpenDesignFormDialog } from '@/features/users/hooks/useOpenDesignFormDialog'
import {
  getFormSubmissionDetail,
  type FormSubmissionDetail,
} from '@/features/users/services/userHistoryApi'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export function HistorySubmissionDetailPage() {
  const { id: userId, submissionId } = useParams<{ id: string; submissionId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<FormSubmissionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { open: openFormDialog } = useOpenDesignFormDialog()

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
    if (detail?.sessionTokenId && userId) {
      navigate(`/users/${userId}/history/tokens/${detail.sessionTokenId}`)
      return
    }
    if (userId) navigate(`/users/${userId}?tab=history`)
    else navigate('/users')
  }

  function openView() {
    if (!detail) return
    openFormDialog({
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
    })
  }

  if (loading && !detail) return null

  if (error && !detail) {
    return (
      <FeaturePage
        title="Form submission"
        description="Unable to load submission."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={back}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
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

  return (
    <FeaturePage
      title={detail.formName}
      description={`Filled for ${detail.subjectDisplayName}`}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={back}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form</CardTitle>
              <CardDescription>Open the submitted form in a dialog</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" size="sm" variant="outline" onClick={openView}>
                View form
              </Button>
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
                value={new Date(detail.createdAt).toLocaleString()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </FeaturePage>
  )
}
