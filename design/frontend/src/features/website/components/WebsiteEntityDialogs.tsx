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
  Checkbox,
  CustomDialog,
  Form,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { pageMetaSchema, slugifyPath, type PageMetaValues } from '../schemas/websiteMeta'

export const WEBSITE_PAGE_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface WebsitePageDialogProps {
  open: boolean
  isSaving: boolean
  error: string | null
  entityId?: string
  initial?: PageMetaValues
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PageMetaValues) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function WebsitePageDialog({
  open,
  isSaving,
  error,
  entityId,
  initial,
  onOpenChange,
  onSubmit,
  onHostedSaved,
  chrome = 'dialog',
}: WebsitePageDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [values, setValues] = useState<PageMetaValues>(initial ?? { name: '', path: '', status: 'active' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [pathTouched, setPathTouched] = useState(Boolean(initial))
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: entityId
      ? `/embed/dialogs/website/pages/${entityId}`
      : '/embed/dialogs/website/pages/create',
    title: isEdit ? t('editPageTitle') : t('createPageTitle'),
    description: isEdit ? undefined : t('createPageDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setValues(initial ?? { name: '', path: '', status: 'active' })
    setFieldErrors({})
    setPathTouched(Boolean(initial))
  }, [open, chrome, initial])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, isSaving)
  }, [dialogRequestId, isSaving, parentOrigin])

  function submit() {
    const parsed = pageMetaSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
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
      <FormField label={t('name')} htmlFor="website-page-name" required error={fieldErrors.name}>
        <Input
          id="website-page-name"
          value={values.name}
          onChange={(e) => {
            const name = e.target.value
            setValues((prev) => ({
              ...prev,
              name,
              path: pathTouched ? prev.path : slugifyPath(name),
            }))
          }}
          disabled={isSaving}
        />
      </FormField>
      <FormField label={t('path')} htmlFor="website-page-path" error={fieldErrors.path}>
        <Input
          id="website-page-path"
          value={values.path}
          onChange={(e) => {
            setPathTouched(true)
            setValues((prev) => ({ ...prev, path: e.target.value }))
          }}
          disabled={isSaving}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">{t('pathHint')}</p>
      <FormField label={t('status')} htmlFor="website-page-status">
        <Select
          value={values.status}
          onValueChange={(status) =>
            setValues((prev) => ({ ...prev, status: status as PageMetaValues['status'] }))
          }
        >
          <SelectTrigger id="website-page-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="inactive">{t('inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </Form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('editPageTitle') : t('createPageTitle')}
      description={isEdit ? undefined : t('createPageDescription')}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PAGE_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={isSaving}>
            {isSaving ? (isEdit ? t('saving') : t('creating')) : isEdit ? tc('save') : t('create')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

export function WebsiteChromeDialog({
  kind,
  open,
  isSaving,
  error,
  initialName,
  onOpenChange,
  onSubmit,
  onHostedSaved,
  chrome = 'dialog',
}: {
  kind: 'headers' | 'footers'
  open: boolean
  isSaving: boolean
  error: string | null
  initialName?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, isDefault: boolean) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [name, setName] = useState(initialName ?? '')
  const [isDefault, setIsDefault] = useState(false)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const title = kind === 'headers' ? t('createHeaderTitle') : t('createFooterTitle')
  const description = kind === 'headers' ? t('createHeaderDescription') : t('createFooterDescription')

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: `/embed/dialogs/website/${kind}/create`,
    title,
    description,
    submitLabel: t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setName(initialName ?? '')
    setIsDefault(false)
  }, [open, chrome, initialName])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, isSaving)
  }, [dialogRequestId, isSaving, parentOrigin])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, isDefault)
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
      <FormField label={t('name')} htmlFor={`website-${kind}-name`} required>
        <Input id={`website-${kind}-name`} value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isDefault} onCheckedChange={(value) => setIsDefault(value === true)} />
        {t('setDefault')}
      </label>
    </Form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PAGE_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={isSaving}>
            {isSaving ? t('creating') : t('create')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

export function WebsiteThemeDialog({
  open,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
  onHostedSaved,
  chrome = 'dialog',
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
  onHostedSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [name, setName] = useState('')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: '/embed/dialogs/website/themes/create',
    title: t('createThemeTitle'),
    description: t('createThemeDescription'),
    submitLabel: t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onHostedSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setName('')
  }, [open, chrome])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, isSaving)
  }, [dialogRequestId, isSaving, parentOrigin])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
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
      <FormField label={t('name')} htmlFor="website-theme-name" required>
        <Input id="website-theme-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
      </FormField>
    </Form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createThemeTitle')}
      description={t('createThemeDescription')}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PAGE_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={isSaving}>
            {isSaving ? t('creating') : t('create')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
