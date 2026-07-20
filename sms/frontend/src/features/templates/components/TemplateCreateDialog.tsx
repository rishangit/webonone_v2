import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Textarea,
} from '@webonone/ui-kit'
import { estimateSegments } from '@/shared/utils/smsSegments'
import {
  templateCreateSchema,
  type TemplateCreateFormValues,
} from '../schemas/templateSchemas'

interface TemplateCreateDialogProps {
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TemplateCreateFormValues) => void
}

const EMPTY: TemplateCreateFormValues = { slug: '', name: '', body: '' }

export function TemplateCreateDialog({
  open,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
}: TemplateCreateDialogProps) {
  const [values, setValues] = useState<TemplateCreateFormValues>({ ...EMPTY })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TemplateCreateFormValues, string>>
  >({})

  useEffect(() => {
    if (!open) return
    setValues({ ...EMPTY })
    setFieldErrors({})
  }, [open])

  const info = useMemo(() => estimateSegments(values.body), [values.body])

  function handleSubmit() {
    const parsed = templateCreateSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New company template"
      description="Create a company-scoped SMS template. Use {{placeholder}} for dynamic values."
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Creating…' : 'Create template'}
          </Button>
        </>
      }
    >
      <Form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <FormField label="Slug" htmlFor="create-slug" required error={fieldErrors.slug}>
          <Input
            id="create-slug"
            placeholder="order_confirmation"
            value={values.slug}
            onChange={(e) => setValues((prev) => ({ ...prev, slug: e.target.value }))}
          />
        </FormField>
        <FormField label="Name" htmlFor="create-name" required error={fieldErrors.name}>
          <Input
            id="create-name"
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Message body" htmlFor="create-body" required error={fieldErrors.body}>
          <Textarea
            id="create-body"
            rows={5}
            value={values.body}
            onChange={(e) => setValues((prev) => ({ ...prev, body: e.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {info.chars} chars · {info.segments} segment(s) · {info.encoding}
          </p>
        </FormField>
      </Form>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </CustomDialog>
  )
}
