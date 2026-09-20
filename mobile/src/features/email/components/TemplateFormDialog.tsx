import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  Muted,
  Textarea,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import {
  mapZodIssuesToFieldErrors,
  templateCreateSchema,
  templateEditorSchema,
  type TemplateCreateFormValues,
  type TemplateEditorFormValues,
} from '@/features/email/schemas/templateSchemas'
import {
  emailAdminApi,
  type CreateTemplateBody,
  type EmailAdminTemplate,
  type UpdateTemplateBody,
} from '@/shared/services/emailAdminApi'

const PLACEHOLDER_HELP = [
  '{{userName}}',
  '{{otp}}',
  '{{actionUrl}}',
  '{{companyName}}',
  '{{logoUrl}}',
  '{{primaryColor}}',
  '{{contactEmail}}',
  '{{footerHtml}}',
  '{{year}}',
]

const EMPTY_CREATE: TemplateCreateFormValues = {
  slug: '',
  name: '',
  subject: '',
  htmlBody: '',
  textBody: '',
}

const EMPTY_EDIT: TemplateEditorFormValues = {
  name: '',
  subject: '',
  htmlBody: '',
  textBody: '',
}

export type TemplateFormMode = 'create' | 'edit'

export function TemplateFormDialog({
  open,
  mode,
  template,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  mode: TemplateFormMode
  template?: EmailAdminTemplate | null
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: EmailAdminTemplate) => void
}) {
  const { toast } = useToast()
  const [createValues, setCreateValues] = useState<TemplateCreateFormValues>(EMPTY_CREATE)
  const [editValues, setEditValues] = useState<TemplateEditorFormValues>(EMPTY_EDIT)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  const isDefault = Boolean(template?.isDefault)
  const title =
    mode === 'create' ? 'Add template' : isDefault ? 'Customize template' : 'Edit template'
  const description =
    mode === 'create'
      ? 'Create a new email template for your account.'
      : isDefault
        ? 'Save a company override based on this platform default.'
        : 'Update template content and subject.'

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (mode === 'create') {
      setCreateValues({ ...EMPTY_CREATE })
      return
    }
    setEditValues({
      name: template?.name ?? '',
      subject: template?.subject ?? '',
      htmlBody: template?.htmlBody ?? '',
      textBody: template?.textBody ?? '',
    })
  }, [mode, open, template])

  async function handleSubmit() {
    if (mode === 'create') {
      const parsed = templateCreateSchema.safeParse(createValues)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      setSaving(true)
      try {
        const saved = await emailAdminApi.createTemplate(parsed.data satisfies CreateTemplateBody)
        toast({ title: 'Template created' })
        onOpenChange(false)
        onSaved?.(saved)
      } catch (err) {
        toast({
          title: 'Failed to create template',
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
      } finally {
        setSaving(false)
      }
      return
    }

    if (!template) return
    const parsed = templateEditorSchema.safeParse(editValues)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const saved = await emailAdminApi.updateTemplate(
        template.id,
        parsed.data satisfies UpdateTemplateBody,
      )
      toast({ title: 'Template saved' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err) {
      toast({
        title: 'Failed to save template',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const values = mode === 'create' ? createValues : editValues

  function patchField<K extends keyof TemplateEditorFormValues>(
    key: K,
    value: TemplateEditorFormValues[K],
  ) {
    if (mode === 'create') {
      setCreateValues((prev) => ({ ...prev, [key]: value }))
    } else {
      setEditValues((prev) => ({ ...prev, [key]: value }))
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth="large"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onPress={() => void handleSubmit()}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </>
      }
    >
      <View className="gap-4">
        {mode === 'create' ? (
          <TextField
            label="Slug"
            required
            autoCapitalize="none"
            value={createValues.slug}
            onChangeText={(slug) => setCreateValues((prev) => ({ ...prev, slug }))}
            error={fieldErrors.slug}
            placeholder="welcome_email"
          />
        ) : template ? (
          <Muted>Slug: {template.slug}</Muted>
        ) : null}

        <TextField
          label="Name"
          required
          value={values.name}
          onChangeText={(name) => patchField('name', name)}
          error={fieldErrors.name}
        />

        <TextField
          label="Subject"
          required
          value={values.subject}
          onChangeText={(subject) => patchField('subject', subject)}
          error={fieldErrors.subject}
        />

        <Textarea
          label="HTML body"
          required
          numberOfLines={8}
          value={values.htmlBody}
          onChangeText={(htmlBody) => patchField('htmlBody', htmlBody)}
          error={fieldErrors.htmlBody}
        />

        <Textarea
          label="Plain text body"
          required
          numberOfLines={5}
          value={values.textBody}
          onChangeText={(textBody) => patchField('textBody', textBody)}
          error={fieldErrors.textBody}
        />

        <Body className="text-sm text-muted">
          Placeholders: {PLACEHOLDER_HELP.join(', ')}
          {mode === 'edit' && template && template.requiredKeys.length > 0
            ? ` · Template-specific: ${template.requiredKeys.map((key) => `{{${key}}}`).join(', ')}`
            : ''}
        </Body>
      </View>
    </CustomDialog>
  )
}
