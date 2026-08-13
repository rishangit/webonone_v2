import { useEffect, useState } from 'react'
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
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formCreateMetaSchema, type FormCreateMetaValues } from '../schemas/formSchemas'

export const DESIGN_FORM_CREATE_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

const EMPTY: FormCreateMetaValues = { name: '', slug: '' }

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 128)
}

interface FormCreateDialogProps {
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: FormCreateMetaValues) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function getFormCreateCopy(t: (key: string) => string) {
  return {
    title: t('createTitle'),
    description: t('createDescription'),
  }
}

export function FormCreateDialog({
  open,
  isSaving,
  error,
  onOpenChange,
  onCreate,
  onHostedSaved,
  chrome = 'dialog',
}: FormCreateDialogProps) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [values, setValues] = useState<FormCreateMetaValues>({ ...EMPTY })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [slugTouched, setSlugTouched] = useState(false)

  const copy = getFormCreateCopy(t)
  const dialogPath = '/embed/dialogs/forms/create'
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
    submitLabel: t('create'),
    ...DESIGN_FORM_CREATE_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setValues({ ...EMPTY })
    setFieldErrors({})
    setSlugTouched(false)
  }, [open, chrome])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, isSaving)
  }, [dialogRequestId, isSaving, parentOrigin])

  function submit() {
    const parsed = formCreateMetaSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onCreate(parsed.data)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const body = (
    <Form className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label={tc('name')} htmlFor="form-name" required error={fieldErrors.name}>
        <Input
          id="form-name"
          value={values.name}
          onChange={(e) => {
            const name = e.target.value
            setValues((prev) => ({
              name,
              slug: slugTouched ? prev.slug : slugify(name),
            }))
          }}
          disabled={isSaving}
        />
      </FormField>
      <FormField label={t('slug')} htmlFor="form-slug" required error={fieldErrors.slug}>
        <Input
          id="form-slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true)
            setValues((prev) => ({ ...prev, slug: e.target.value }))
          }}
          disabled={isSaving}
        />
      </FormField>
    </Form>
  )

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => onOpenChange(false)}
        disabled={isSaving}
      >
        {tc('cancel')}
      </Button>
      <Button type="button" className="h-10 px-4" onClick={submit} disabled={isSaving}>
        {isSaving ? t('creating') : t('create')}
      </Button>
    </>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
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
      sizeWidth={DESIGN_FORM_CREATE_DIALOG_SIZE.sizeWidth}
      sizeHeight={DESIGN_FORM_CREATE_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {body}
    </CustomDialog>
  )
}
