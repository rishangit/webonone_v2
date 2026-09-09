import { useEffect, useMemo, useState } from 'react'
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
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteFontTokenSchema } from '../../schemas/websiteThemeSchemas'
import type { WebsiteFontToken } from '../../types'
import {
  normalizeGoogleFontInput,
  parseGoogleFontFamily,
} from '../../utils/parseGoogleFontFamily'
import { themeFontFamilyStyle } from '../../utils/themeFontPreview'
import { GOOGLE_FONTS_ORIGIN } from '../../utils/googleFontsConfig'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'

const GOOGLE_FONT_URL_PLACEHOLDER =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'

function mapFontFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
  invalidUrlMessage: string,
): Partial<Record<string, string>> {
  const errors = mapZodIssuesToFieldErrors(issues)
  if (errors.googleFontUrl === 'Enter a valid Google Font URL') {
    errors.googleFontUrl = invalidUrlMessage
  }
  return errors
}

export function ThemeFontDialog({
  open,
  themeId,
  initial,
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  initial?: WebsiteFontToken
  onOpenChange: (open: boolean) => void
  onSubmit: (font: WebsiteFontToken) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [googleFontUrl, setGoogleFontUrl] = useState(initial?.googleFontUrl ?? '')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${themeId}/fonts/${initial.id}`
      : `/embed/dialogs/website/themes/${themeId}/fonts/create`,
    title: isEdit ? t('editFontTitle') : t('createFontTitle'),
    description: isEdit ? undefined : t('createFontDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: (payload) => {
      const parsed = websiteFontTokenSchema.safeParse(payload)
      if (parsed.success) {
        onSubmit(parsed.data)
      } else {
        toast({
          title: t('saveFailed'),
          description: t('invalidGoogleFontUrl'),
          variant: 'destructive',
        })
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setName(initial?.name ?? '')
    setGoogleFontUrl(initial?.googleFontUrl ?? '')
    setFieldErrors({})
  }, [chrome, initial, open])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  const normalizedUrl = useMemo(() => normalizeGoogleFontInput(googleFontUrl), [googleFontUrl])
  const family = parseGoogleFontFamily(googleFontUrl) ?? (initial?.family ?? '')
  const previewStyles = themeFontFamilyStyle(family)

  function normalizeUrlField() {
    setGoogleFontUrl((current) => normalizeGoogleFontInput(current))
  }

  function submit() {
    const url = normalizeGoogleFontInput(googleFontUrl)
    const parsedFamily = parseGoogleFontFamily(url) ?? ''
    const styleName = name.trim() || parsedFamily
    const parsed = websiteFontTokenSchema.safeParse({
      id: initial?.id ?? nanoid(8),
      name: styleName,
      googleFontUrl: url,
      family: parsedFamily,
    })
    if (!parsed.success) {
      setFieldErrors(mapFontFieldErrors(parsed.error.issues, t('invalidGoogleFontUrl')))
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
      {normalizedUrl ? <link rel="stylesheet" href={normalizedUrl} /> : null}
      <FormField label={t('styleName')} htmlFor="theme-font-name" required error={fieldErrors.name}>
        <Input id="theme-font-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField
        label={t('googleFontUrl')}
        htmlFor="theme-font-url"
        required
        error={fieldErrors.googleFontUrl}
      >
        <Input
          id="theme-font-url"
          value={googleFontUrl}
          placeholder={GOOGLE_FONT_URL_PLACEHOLDER}
          onChange={(event) => setGoogleFontUrl(event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text')
            const normalized = normalizeGoogleFontInput(pasted)
            if (normalized !== pasted.trim()) {
              event.preventDefault()
              setGoogleFontUrl(normalized)
            }
          }}
          onBlur={normalizeUrlField}
        />
        <p className="text-sm text-muted-foreground">{t('googleFontUrlHint')}</p>
        <a
          href={GOOGLE_FONTS_ORIGIN}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('openGoogleFonts')}
        </a>
      </FormField>
      <FormField label={t('fontFamily')} htmlFor="theme-font-family" error={fieldErrors.family}>
        <Input id="theme-font-family" value={family} readOnly style={previewStyles} />
        {family ? (
          <p className="text-sm text-muted-foreground" style={previewStyles}>
            {t('textPreviewSample')}
          </p>
        ) : null}
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
      title={isEdit ? t('editFontTitle') : t('createFontTitle')}
      description={isEdit ? undefined : t('createFontDescription')}
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
