import { useEffect, useMemo, useState } from 'react'
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
} from '@/features/sms/schemas/templateSchemas'
import { estimateSegments } from '@/features/sms/utils/smsSegments'
import {
  smsAdminApi,
  type CreateSmsTemplateBody,
  type SmsAdminTemplate,
  type UpdateSmsTemplateBody,
} from '@/shared/services/smsAdminApi'

const EMPTY_CREATE: TemplateCreateFormValues = {
  slug: '',
  name: '',
  body: '',
}

const EMPTY_EDIT: TemplateEditorFormValues = {
  name: '',
  body: '',
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
  template?: SmsAdminTemplate | null
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: SmsAdminTemplate) => void
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
      ? 'Create a new SMS template for your account.'
      : isDefault
        ? 'Save a company copy of this default template.'
        : 'Update the template name and message body.'

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (mode === 'create') {
      setCreateValues(EMPTY_CREATE)
      return
    }
    setEditValues({
      name: template?.name ?? '',
      body: template?.body ?? '',
    })
  }, [open, mode, template])

  const body = mode === 'create' ? createValues.body : editValues.body
  const segmentInfo = useMemo(() => estimateSegments(body), [body])

  async function handleSave() {
    if (mode === 'create') {
      const parsed = templateCreateSchema.safeParse(createValues)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      setSaving(true)
      try {
        const saved = await smsAdminApi.createTemplate(parsed.data as CreateSmsTemplateBody)
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
      const saved = await smsAdminApi.updateTemplate(
        template.id,
        parsed.data as UpdateSmsTemplateBody,
      )
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

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onPress={() => void handleSave()}>
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
            value={createValues.slug}
            onChangeText={(slug) => setCreateValues((prev) => ({ ...prev, slug }))}
            error={fieldErrors.slug}
            autoCapitalize="none"
            placeholder="order_confirmation"
          />
        ) : template ? (
          <Muted>Slug: {template.slug}</Muted>
        ) : null}

        <TextField
          label="Name"
          required
          value={mode === 'create' ? createValues.name : editValues.name}
          onChangeText={(name) => {
            if (mode === 'create') {
              setCreateValues((prev) => ({ ...prev, name }))
            } else {
              setEditValues((prev) => ({ ...prev, name }))
            }
          }}
          error={fieldErrors.name}
        />

        <Textarea
          label="Message body"
          required
          numberOfLines={5}
          value={body}
          onChangeText={(nextBody) => {
            if (mode === 'create') {
              setCreateValues((prev) => ({ ...prev, body: nextBody }))
            } else {
              setEditValues((prev) => ({ ...prev, body: nextBody }))
            }
          }}
          error={fieldErrors.body}
        />
        <Body className="text-xs text-muted-foreground">
          {segmentInfo.chars} chars · {segmentInfo.segments} segment
          {segmentInfo.segments === 1 ? '' : 's'} · {segmentInfo.encoding}
        </Body>
      </View>
    </CustomDialog>
  )
}
