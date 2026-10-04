import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDisplayDateTime } from '@webonone/i18n'
import { FileText, Pencil, Save } from 'lucide-react'
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
  Form,
  FormField,
  ImagePreview,
  mapZodIssuesToFieldErrors,
  Spinner,
  StatusTag,
  Textarea,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isSessionSuperAdmin } from '@/features/auth/utils/currentRole'
import { getSessionUserId } from '@/features/auth/utils/sessionUser'
import { FeedbackFormDialog } from '@/features/feedback/components/FeedbackFormDialog'
import { useVisibleInterval } from '@/features/feedback/hooks/useVisibleInterval'
import { feedbackCommentFormSchema } from '@/features/feedback/schemas/feedbackSchemas'
import { feedbackApi } from '@/features/feedback/services/feedbackApi'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'
import { feedbackStatusTagProps } from '@/features/feedback/utils/feedbackStatus'

const DETAIL_POLL_MS = 15_000

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}

export function FeedbackDetailPage() {
  const { t, i18n } = useTranslation('feedback')
  const { ticketNumber = '' } = useParams<{ ticketNumber: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const {
    detail,
    detailStatus,
    detailError,
    commentsByReportId,
    commentsStatus,
    commentCreateStatus,
    editStatus,
    editError,
    specDocs,
    specDocsStatus,
    specDocsTicketNumber,
  } = useAppSelector((s) => s.feedback)

  const [editOpen, setEditOpen] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentFieldError, setCommentFieldError] = useState<string | undefined>()

  const report = detail?.ticketNumber === ticketNumber ? detail : null
  const reportId = report?.id ?? ''
  const comments = reportId ? commentsByReportId[reportId] ?? [] : []
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const sessionUserId = getSessionUserId(accessToken)
  const canEdit = Boolean(report) && (isSuperAdmin || report?.reporterUserId === sessionUserId)
  const statusTag = report ? feedbackStatusTagProps(report.status) : null
  const loading = detailStatus === 'loading' && !report

  useEffect(() => {
    if (!accessToken || !ticketNumber) return
    dispatch(feedbackActions.fetchDetailRequested({ ticketNumber }))
  }, [accessToken, dispatch, ticketNumber])

  useEffect(() => {
    return () => {
      dispatch(feedbackActions.clearDetail())
    }
  }, [dispatch])

  useVisibleInterval(
    () => {
      if (!ticketNumber) return
      dispatch(feedbackActions.fetchDetailRequested({ ticketNumber }))
    },
    DETAIL_POLL_MS,
    Boolean(accessToken && ticketNumber),
  )

  useEffect(() => {
    if (!reportId) return
    dispatch(feedbackActions.loadCommentsRequested(reportId))
    void feedbackApi.markViewed(reportId).then(() => {
      dispatch(feedbackActions.clearUnreadForReport(reportId))
    })
  }, [dispatch, reportId])

  useEffect(() => {
    if (!accessToken || !ticketNumber || !report) return
    dispatch(feedbackActions.loadSpecDocsRequested({ ticketNumber }))
  }, [accessToken, dispatch, report, ticketNumber])

  const planningDocs =
    specDocsTicketNumber === ticketNumber ? specDocs : []
  const showPlanningDocs =
    planningDocs.length > 0 || (specDocsStatus === 'loading' && Boolean(report))

  useEffect(() => {
    if (commentCreateStatus === 'succeeded') {
      setCommentBody('')
      dispatch(feedbackActions.resetCommentCreateStatus())
      toast({ title: t('commentSuccess') })
    }
  }, [commentCreateStatus, dispatch, t, toast])

  useEffect(() => {
    if (editStatus === 'succeeded') {
      setEditOpen(false)
      dispatch(feedbackActions.resetEditStatus())
      toast({ title: t('editSuccess') })
    }
  }, [dispatch, editStatus, t, toast])

  function handleCommentSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!reportId) return
    const result = feedbackCommentFormSchema.safeParse({ body: commentBody })
    if (!result.success) {
      setCommentFieldError(
        mapZodIssuesToFieldErrors(result.error.issues).body as string | undefined,
      )
      return
    }
    setCommentFieldError(undefined)
    dispatch(feedbackActions.commentCreateRequested({ reportId, body: result.data }))
  }

  return (
    <FeaturePage
      title={report ? `#${report.ticketNumber} — ${report.title}` : t('detailPageTitle')}
      description={t('detailDescription')}
      onBack={() => navigate('/feedback')}
      backLabel={t('common:back')}
      actions={
        canEdit && report ? (
          <Button type="button" className="h-10" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('common:edit')}
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {detailError && !report ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {report && statusTag ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('overviewCardTitle')}</CardTitle>
                <CardDescription>{t('overviewCardDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {report.description}
                </p>
                {report.attachmentUrl ? (
                  <a
                    href={report.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('screenshotLinkAria', {
                      title: report.title,
                      fileName: report.attachmentFileName ?? 'screenshot',
                    })}
                  >
                    <ImagePreview
                      src={report.attachmentUrl}
                      alt={report.attachmentFileName ?? t('screenshotAlt')}
                      mode="view"
                      className="h-40 w-40 rounded-md"
                    />
                  </a>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('commentsTitle')}</CardTitle>
                <CardDescription>{t('commentsCardDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commentsStatus === 'loading' && comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('commentsLoading')}</p>
                ) : null}
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-3"
                    >
                      <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {comment.authorEmail} ·{' '}
                        {formatDisplayDateTime(comment.createdAt, i18n.language)}
                      </p>
                    </li>
                  ))}
                  {commentsStatus === 'succeeded' && comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('commentsEmpty')}</p>
                  ) : null}
                </ul>
                <Form
                  onSubmit={handleCommentSubmit}
                  className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4"
                >
                  <FormField
                    htmlFor="feedback-comment"
                    label={t('commentFieldLabel')}
                    required
                    error={commentFieldError}
                  >
                    <Textarea
                      id="feedback-comment"
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      rows={4}
                      placeholder={t('commentPlaceholder')}
                    />
                  </FormField>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="h-10"
                      disabled={commentCreateStatus === 'loading'}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t('addComment')}
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('detailsCardTitle')}</CardTitle>
                <CardDescription>{t('detailsCardDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField
                  label={t('filterStatus')}
                  value={
                    <StatusTag variant={statusTag.variant} className={statusTag.className}>
                      {t(`status.${report.status}`)}
                    </StatusTag>
                  }
                />
                <ReadOnlyField label={t('fields.type')} value={t(`type.${report.type}`)} />
                <ReadOnlyField
                  label={t('reportedByLabel')}
                  value={report.reporterEmail}
                />
                <ReadOnlyField
                  label={t('createdAtLabel')}
                  value={formatDisplayDateTime(report.createdAt, i18n.language)}
                />
                <ReadOnlyField
                  label={t('updatedAtLabel')}
                  value={formatDisplayDateTime(report.updatedAt, i18n.language)}
                />
              </CardContent>
            </Card>

            {showPlanningDocs ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('specDocsCardTitle')}</CardTitle>
                  <CardDescription>{t('specDocsCardDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {specDocsStatus === 'loading' && planningDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('specDocsLoading')}</p>
                  ) : null}
                  {planningDocs.map((doc) => {
                    const labelKey =
                      doc.fileName === 'spec.md'
                        ? 'specDoc.spec'
                        : doc.fileName === 'plan.md'
                          ? 'specDoc.plan'
                          : 'specDoc.developmentSummary'
                    return (
                      <Button
                        key={doc.fileName}
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start border-[hsl(var(--glass-border))]"
                        onClick={() =>
                          navigate(`/feedback/${report.ticketNumber}/docs/${doc.fileName}`)
                        }
                      >
                        <FileText className="mr-2 h-4 w-4 shrink-0" />
                        {t(labelKey)}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {report ? (
        <FeedbackFormDialog
          mode="edit"
          open={editOpen}
          isSaving={editStatus === 'loading'}
          error={editError}
          accessToken={accessToken}
          initialValues={{
            type: report.type,
            title: report.title,
            description: report.description,
            attachment:
              report.attachmentMediaId && report.attachmentUrl
                ? {
                    mediaId: report.attachmentMediaId,
                    url: report.attachmentUrl,
                    fileName: report.attachmentFileName ?? 'screenshot',
                    mimeType: report.attachmentMimeType ?? 'image/png',
                  }
                : undefined,
          }}
          onOpenChange={setEditOpen}
          onSubmit={(values) =>
            dispatch(feedbackActions.updateRequested({ id: report.id, values }))
          }
        />
      ) : null}
    </FeaturePage>
  )
}
