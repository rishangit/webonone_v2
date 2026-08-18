import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Button,
  ColorInput,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteColorTokenSchema } from '../../schemas/websiteThemeSchemas'
import type { WebsiteColorToken } from '../../types'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'

export function ThemeColorDialog({
  open,
  themeId,
  initial,
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  initial?: WebsiteColorToken
  onOpenChange: (open: boolean) => void
  onSubmit: (color: WebsiteColorToken) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [value, setValue] = useState(initial?.value ?? '#111827')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${themeId}/colors/${initial.id}`
      : `/embed/dialogs/website/themes/${themeId}/colors/create`,
    title: isEdit ? t('editColorTitle') : t('createColorTitle'),
    description: isEdit ? undefined : t('createColorDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: (payload) => {
      const parsed = websiteColorTokenSchema.safeParse(payload)
      if (parsed.success) onSubmit(parsed.data)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setName(initial?.name ?? '')
    setValue(initial?.value ?? '#111827')
    setFieldErrors({})
  }, [chrome, initial, open])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  function submit() {
    const parsed = websiteColorTokenSchema.safeParse({
      id: initial?.id ?? nanoid(8),
      name,
      value,
    })
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
      <FormField label={t('name')} htmlFor="theme-color-name" required error={fieldErrors.name}>
        <Input id="theme-color-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('color')} htmlFor="theme-color-value" required error={fieldErrors.value}>
        <ColorInput id="theme-color-value" value={value} onChange={setValue} />
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
      title={isEdit ? t('editColorTitle') : t('createColorTitle')}
      description={isEdit ? undefined : t('createColorDescription')}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight={WEBSITE_PAGE_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit}>
            {isEdit ? tc('save') : t('create')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
