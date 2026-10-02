import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDisplayDateTime } from '@webonone/i18n'
import { Pencil, Save } from 'lucide-react'
import {
  Button,
  CustomDialog,
  Form,
  FormField,
  mapZodIssuesToFieldErrors,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { FeedbackFormDialog } from '@/features/feedback/components/FeedbackFormDialog'
import type { FeedbackReport } from '@/features/feedback/services/feedbackApi'
import { feedbackCommentFormSchema } from '@/features/feedback/schemas/feedbackSchemas'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'
import { feedbackApi } from '@/features/feedback/services/feedbackApi'

type FeedbackDetailDialogProps = {
  report: FeedbackReport | null
  open: boolean
  canEdit: boolean
  accessToken: string | null
  onOpenChange: (open: boolean) => void
}

export function FeedbackDetailDialog({
  report,
  open,
  canEdit,
  accessToken,
  onOpenChange,
}: FeedbackDetailDialogProps) {
  const { t, i18n } = useTranslation('feedback')
  const dispatch = useAppDispatch()
  const [editOpen, setEditOpen] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentFieldError, setCommentFieldError] = useState<string | undefined>()

  const {
    commentsByReportId,
    commentsStatus,
    commentCreateStatus,
    editStatus,
    editError,
  } = useAppSelector((s) => s.feedback)

  const reportId = report?.id ?? ''
  const comments = reportId ? commentsByReportId[reportId] ?? [] : []

  useEffect(() => {
    if (!open || !reportId) return
    dispatch(feedbackActions.loadCommentsRequested(reportId))
    void feedbackApi.markViewed(reportId).then(() => {
      dispatch(feedbackActions.clearUnreadForReport(reportId))
    })
  }, [dispatch, open, reportId])

  useEffect(() => {
    if (!open) {
      setCommentBody('')
      setCommentFieldError(undefined)
      setEditOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (commentCreateStatus === 'succeeded') {
      setCommentBody('')
      dispatch(feedbackActions.resetCommentCreateStatus())
    }
  }, [commentCreateStatus, dispatch])

  useEffect(() => {
    if (editStatus === 'succeeded') {
      setEditOpen(false)
      dispatch(feedbackActions.resetEditStatus())
    }
  }, [dispatch, editStatus])

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

  if (!report) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={report.title}
        description={t('detailDescription')}
        sizeWidth="medium"
        sizeHeight="large"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => onOpenChange(false)}
            >
              {t('common:close')}
            </Button>
            {canEdit ? (
              <Button type="button" className="h-10" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('common:edit')}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="space-y-6">
          <p className="whitespace-pre-wrap text-sm text-foreground">{report.description}</p>
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">{t('commentsTitle')}</h3>
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
          </div>
          <Form onSubmit={handleCommentSubmit} className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
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
        </div>
      </CustomDialog>

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
    </>
  )
}
