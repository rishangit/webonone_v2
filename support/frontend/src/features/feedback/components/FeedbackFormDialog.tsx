import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
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
import {
  createFeedbackFormSchema,
  type CreateFeedbackFormValues,
} from '@/features/feedback/schemas/feedbackSchemas'

const EMPTY_VALUES: CreateFeedbackFormValues = {
  type: 'bug',
  title: '',
  description: '',
}

type FeedbackFormDialogProps = {
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateFeedbackFormValues) => void
}

export function FeedbackFormDialog({
  open,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
}: FeedbackFormDialogProps) {
  const { t } = useTranslation('feedback')
  const [values, setValues] = useState<CreateFeedbackFormValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) {
      setValues(EMPTY_VALUES)
      setFieldErrors({})
    }
  }, [open])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = createFeedbackFormSchema.safeParse(values)
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
      title={t('createTitle')}
      description={t('createDescription')}
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
            {t('submitReport')}
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
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            placeholder={t('fields.titlePlaceholder')}
          />
        </FormField>
        <FormField htmlFor="feedback-description" label={t('fields.description')} required error={fieldErrors.description}>
          <Textarea
            id="feedback-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder={t('fields.descriptionPlaceholder')}
            rows={6}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
