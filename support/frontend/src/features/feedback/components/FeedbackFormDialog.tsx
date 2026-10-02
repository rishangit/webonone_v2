import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import type { SelectMediaValue } from '@webonone/ui-kit'
import {
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import { FeedbackScreenshotField } from '@/features/feedback/components/FeedbackScreenshotField'
import {
  createFeedbackFormSchema,
  updateFeedbackFormSchema,
  type CreateFeedbackFormValues,
  type UpdateFeedbackFormValues,
} from '@/features/feedback/schemas/feedbackSchemas'
import { createFeedbackUploadSessionId } from '@/features/feedback/utils/uploadSessionId'

const EMPTY_VALUES: Omit<CreateFeedbackFormValues, 'uploadSessionId' | 'attachment'> = {
  type: 'bug',
  title: '',
  description: '',
}

type FeedbackFormDialogProps = {
  mode?: 'create' | 'edit'
  initialValues?: Partial<CreateFeedbackFormValues>
  open: boolean
  isSaving: boolean
  error: string | null
  accessToken: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateFeedbackFormValues | UpdateFeedbackFormValues) => void
}

export function FeedbackFormDialog({
  mode = 'create',
  initialValues,
  open,
  isSaving,
  error,
  accessToken,
  onOpenChange,
  onSubmit,
}: FeedbackFormDialogProps) {
  const { t } = useTranslation('feedback')
  const [values, setValues] = useState(EMPTY_VALUES)
  const [uploadSessionId, setUploadSessionId] = useState('')
  const [screenshot, setScreenshot] = useState<SelectMediaValue | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setUploadSessionId(createFeedbackUploadSessionId())
      setValues({
        type: initialValues?.type ?? EMPTY_VALUES.type,
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
      })
      setScreenshot(
        initialValues?.attachment
          ? {
              id: initialValues.attachment.mediaId,
              url: initialValues.attachment.url,
              fileName: initialValues.attachment.fileName,
              mimeType: initialValues.attachment.mimeType,
            }
          : null,
      )
      setFieldErrors({})
      return
    }
    setUploadSessionId('')
    setValues(EMPTY_VALUES)
    setScreenshot(null)
    setFieldErrors({})
  }, [initialValues?.attachment, initialValues?.description, initialValues?.title, initialValues?.type, open])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const payload: CreateFeedbackFormValues = {
      ...values,
      ...(screenshot
        ? {
            uploadSessionId,
            attachment: {
              mediaId: screenshot.id,
              url: screenshot.url,
              fileName: screenshot.fileName,
              mimeType: screenshot.mimeType,
            },
          }
        : {}),
    }
    const schema = mode === 'edit' ? updateFeedbackFormSchema : createFeedbackFormSchema
    const editPayload =
      mode === 'edit'
        ? {
            ...payload,
            clearAttachment: !screenshot && Boolean(initialValues?.attachment),
          }
        : payload
    const result = schema.safeParse(editPayload)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues) as Record<string, string>)
      return
    }
    setFieldErrors({})
    onSubmit(result.data)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? t('editTitle') : t('createTitle')}
      description={mode === 'edit' ? t('editDescription') : t('createDescription')}
      sizeWidth="small"
      sizeHeight="large"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {t('common:cancel')}
          </Button>
          <Button type="submit" form="feedback-create-form" className="h-10" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'edit' ? t('saveChanges') : t('submitReport')}
          </Button>
        </>
      }
    >
      <Form id="feedback-create-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <FormField htmlFor="feedback-type" label={t('fields.type')} required error={fieldErrors.type}>
          <Select
            value={values.type}
            onValueChange={(value) =>
              setValues((current) => ({ ...current, type: value as CreateFeedbackFormValues['type'] }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('fields.typePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">{t('type.bug')}</SelectItem>
              <SelectItem value="feature">{t('type.feature')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField htmlFor="feedback-title" label={t('fields.title')} required error={fieldErrors.title}>
          <Input
            id="feedback-title"
            name="title"
            aiAssist
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            placeholder={t('fields.titlePlaceholder')}
          />
        </FormField>
        <FormField htmlFor="feedback-description" label={t('fields.description')} required error={fieldErrors.description}>
          <Textarea
            id="feedback-description"
            name="description"
            aiAssist
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder={t('fields.descriptionPlaceholder')}
            rows={6}
          />
        </FormField>
        {uploadSessionId ? (
          <FeedbackScreenshotField
            accessToken={accessToken}
            uploadSessionId={uploadSessionId}
            value={screenshot}
            onChange={setScreenshot}
            error={fieldErrors.attachment}
          />
        ) : null}
      </Form>
    </CustomDialog>
  )
}
