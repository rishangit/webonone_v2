import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
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
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { SmsTemplate } from '@/shared/types/sms.types'
import { estimateSegments } from '@/shared/utils/smsSegments'
import {
  templateCreateSchema,
  templateEditorSchema,
  type TemplateCreateFormValues,
  type TemplateEditorFormValues,
} from '../schemas/templateSchemas'

export type TemplateFormMode = 'create' | 'edit'

export const SMS_TEMPLATE_FORM_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface TemplateFormDialogProps {
  open: boolean
  mode: TemplateFormMode
  template?: SmsTemplate | null
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: TemplateCreateFormValues) => void
  onUpdate: (values: TemplateEditorFormValues) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}

const EMPTY_CREATE: TemplateCreateFormValues = { slug: '', name: '', body: '' }
const EMPTY_EDIT: TemplateEditorFormValues = { name: '', body: '' }

function templateDialogPath(mode: TemplateFormMode, templateId?: string | null): string {
  if (mode === 'create') {
    return '/embed/dialogs/templates/create'
  }
  return `/embed/dialogs/templates/${templateId ?? 'unknown'}/edit`
}

export function getSmsTemplateFormCopy(
  mode: TemplateFormMode,
  t: (key: string) => string,
  template?: SmsTemplate | null,
): {
  title: string
  description: string
} {
  if (mode === 'create') {
    return {
      title: t('form.createTitle'),
      description: t('form.createDescription'),
    }
  }
  return {
    title: template?.isDefault ? t('form.customizeTitle') : t('form.editTitle'),
    description: template?.isDefault
      ? t('form.customizeDescription')
      : t('form.editDescription'),
  }
}

export function TemplateFormDialog({
  open,
  mode,
  template,
  isSaving,
  error,
  onOpenChange,
  onCreate,
  onUpdate,
  onHostedSaved,
  chrome = 'dialog',
}: TemplateFormDialogProps) {
  const { t } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [createValues, setCreateValues] = useState<TemplateCreateFormValues>({ ...EMPTY_CREATE })
  const [editValues, setEditValues] = useState<TemplateEditorFormValues>({ ...EMPTY_EDIT })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  const copy = getSmsTemplateFormCopy(mode, t, template)
  const dialogPath = templateDialogPath(mode, template?.id)
  const idleSubmitLabel = mode === 'create' ? t('form.create') : tc('save')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: dialogPath,
    title: copy.title,
    description: copy.description,
    submitLabel: idleSubmitLabel,
    ...SMS_TEMPLATE_FORM_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setFieldErrors({})
    if (mode === 'create') {
      setCreateValues({ ...EMPTY_CREATE })
      return
    }
    setEditValues({
      name: template?.name ?? '',
      body: template?.body ?? '',
    })
  }, [open, mode, template, chrome])

  const body = mode === 'create' ? createValues.body : editValues.body
  const info = useMemo(() => estimateSegments(body), [body])

  function handleSubmit() {
    if (mode === 'create') {
      const parsed = templateCreateSchema.safeParse(createValues)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      onCreate(parsed.data)
      return
    }

    const parsed = templateEditorSchema.safeParse(editValues)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onUpdate(parsed.data)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: handleSubmit,
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      isSaving,
      isSaving ? (mode === 'create' ? t('form.creating') : t('form.saving')) : idleSubmitLabel,
    )
  }, [chrome, dialogRequestId, idleSubmitLabel, isSaving, mode, parentOrigin, t])

  const submitLabel = isSaving
    ? mode === 'create'
      ? t('form.creating')
      : t('form.saving')
    : idleSubmitLabel

  const formBody = (
    <>
      <Form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {mode === 'create' ? (
          <FormField label={t('slug')} htmlFor="template-slug" required error={fieldErrors.slug}>
            <Input
              id="template-slug"
              placeholder="order_confirmation"
              value={createValues.slug}
              onChange={(e) => setCreateValues((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </FormField>
        ) : template ? (
          <p className="text-sm text-muted-foreground">
            {t('form.slugValue', { slug: template.slug })}
          </p>
        ) : null}

        <FormField label={tc('name')} htmlFor="template-name" required error={fieldErrors.name}>
          <Input
            id="template-name"
            value={mode === 'create' ? createValues.name : editValues.name}
            onChange={(e) => {
              const name = e.target.value
              if (mode === 'create') {
                setCreateValues((prev) => ({ ...prev, name }))
              } else {
                setEditValues((prev) => ({ ...prev, name }))
              }
            }}
          />
        </FormField>

        <FormField label={t('messageBody')} htmlFor="template-body" required error={fieldErrors.body}>
          <Textarea
            id="template-body"
            rows={5}
            value={body}
            onChange={(e) => {
              const nextBody = e.target.value
              if (mode === 'create') {
                setCreateValues((prev) => ({ ...prev, body: nextBody }))
              } else {
                setEditValues((prev) => ({ ...prev, body: nextBody }))
              }
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('form.segmentLine', {
              chars: info.chars,
              segments: info.segments,
              encoding: info.encoding,
            })}
          </p>
        </FormField>
      </Form>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  )

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSaving}
      >
        {tc('cancel')}
      </Button>
      <Button type="button" onClick={handleSubmit} disabled={isSaving}>
        {submitLabel}
      </Button>
    </>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{formBody}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      sizeWidth={SMS_TEMPLATE_FORM_DIALOG_SIZE.sizeWidth}
      sizeHeight={SMS_TEMPLATE_FORM_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {formBody}
    </CustomDialog>
  )
}
