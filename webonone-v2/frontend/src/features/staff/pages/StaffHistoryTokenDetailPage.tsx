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
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import {
  getSessionTokenHistoryDetail,
  listSubmissionsForSessionToken,
  type FormSubmissionDetail,
  type SessionTokenHistoryDetail,
} from '@/features/staff/services/staffHistoryApi'
import { formatCalendarYmd, formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'

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

function FilledFormCard({
  submission,
  language,
}: {
  submission: FormSubmissionDetail
  language: string
}) {
  const answerEntries = Object.entries(submission.answers ?? {})
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{submission.formName}</CardTitle>
        <CardDescription>
          For {submission.subjectDisplayName} · {formatLocaleDateTime(submission.createdAt, language)}
        </CardDescription>
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
  )
}

export function StaffHistoryTokenDetailPage() {
  const { staffId, tokenId } = useParams<{ staffId: string; tokenId: string }>()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [detail, setDetail] = useState<SessionTokenHistoryDetail | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmissionDetail[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  usePlatformLoading(loading && !detail ? 'Loading history…' : null)

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
          setError(err instanceof Error ? err.message : 'Unable to load history detail')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tokenId])

  const backToStaff = () => {
    if (staffId) navigate(`/staff/${staffId}?tab=history`)
    else navigate('/staff')
  }

  if (loading && !detail) return null

  if (error && !detail) {
    return (
      <FeaturePage
        title="Session history"
        description="Unable to load session history."
        onBack={backToStaff}
        backLabel="Back"
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
      title={detail.serviceName}
      description={`Token ${detail.tokenLabel} · ${formatCalendarYmd(detail.occurrenceDate, i18n.language)}`}
      onBack={backToStaff}
      backLabel="Back"
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session</CardTitle>
              <CardDescription>Occurrence and token for this visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Service" value={detail.serviceName} />
              <DetailField label="Date" value={formatCalendarYmd(detail.occurrenceDate, i18n.language)} />
              <DetailField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
              <DetailField label="Token" value={detail.tokenLabel} />
              {detail.workflowProgress ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Progress</p>
                  <TokenWorkflowProgress progress={detail.workflowProgress} />
                </div>
              ) : null}
              <DetailField label="Status" value={detail.status} />
              <DetailField label="Customer" value={detail.userDisplayName} />
              {detail.spaceName ? <DetailField label="Space" value={detail.spaceName} /> : null}
            </CardContent>
          </Card>

          {submissions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filled forms</CardTitle>
                <CardDescription>Forms filled for this event session</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemListEmpty>No forms filled for this session yet.</ItemListEmpty>
              </CardContent>
            </Card>
          ) : (
            submissions.map((sub) => (
              <FilledFormCard key={sub.id} submission={sub} language={i18n.language} />
            ))
          )}

          <Card variant="list">
            <CardHeader>
              <CardTitle className="text-lg">Sales</CardTitle>
              <CardDescription>Bills recorded during this session token</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.sales.length === 0 ? (
                <ItemListEmpty>No sales for this session yet.</ItemListEmpty>
              ) : (
                <ItemList className="py-0">
                  {detail.sales.map((sale) => (
                    <ItemListItem
                      key={sale.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => navigate(`/sales/${sale.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/sales/${sale.id}`)
                        }
                      }}
                    >
                      <ItemListContent>
                        <p className="font-medium">{sale.billNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.currency} {sale.total.toFixed(2)} · {sale.paymentMethod}
                        </p>
                      </ItemListContent>
                    </ItemListItem>
                  ))}
                </ItemList>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff</CardTitle>
              <CardDescription>Staff member for this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Name" value={detail.staffDisplayName} />
            </CardContent>
          </Card>
        </div>
      </div>
    </FeaturePage>
  )
}
