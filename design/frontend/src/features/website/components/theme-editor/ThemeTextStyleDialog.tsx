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
  CustomDialog,
  Form,
  FormField,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { fallbackTextSize, resolveTextStyle } from '../../document/theme'
import { websiteTextStyleSchema } from '../../schemas/websiteThemeSchemas'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../../types'
import { mapThemeFieldErrors } from '../../utils/mapThemeFieldErrors'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'
import { defaultSizeByBreakpoint, SIZE_LABEL_KEYS } from './textStyleDefaults'
import { ThemeTokenSelect } from './ThemeTokenSelect'

export function ThemeTextStyleDialog({
  open,
  theme,
  initial,
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  theme: WebsiteTheme
  initial?: WebsiteTextStyle
  onOpenChange: (open: boolean) => void
  onSubmit: (style: WebsiteTextStyle) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [values, setValues] = useState<WebsiteTextStyle>(emptyTextStyle(theme, initial))
  const [previewBreakpoint, setPreviewBreakpoint] = useState<WebsiteBreakpoint>('lg')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${theme.id}/texts/${initial.id}`
      : `/embed/dialogs/website/themes/${theme.id}/texts/create`,
    title: isEdit ? t('editTextStyleTitle') : t('createTextStyleTitle'),
    description: isEdit ? undefined : t('createTextStyleDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: (payload) => {
      const parsed = websiteTextStyleSchema.safeParse(payload)
      if (parsed.success) onSubmit(parsed.data)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setValues(emptyTextStyle(theme, initial))
    setPreviewBreakpoint('lg')
    setFieldErrors({})
  }, [chrome, initial, open, theme]) // hydrate when the dialog opens; theme.id is stable

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  function submit() {
    const parsed = websiteTextStyleSchema.safeParse({
      ...values,
      size: fallbackTextSize(values.sizeByBreakpoint),
    })
    if (!parsed.success) {
      setFieldErrors(mapThemeFieldErrors(parsed.error.issues))
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

  const snap = resolveTextStyle(theme, values, previewBreakpoint)

  const body = (
    <Form className="space-y-4">
      <FormField label={t('styleName')} htmlFor="theme-text-name" required error={fieldErrors.name}>
        <Input
          id="theme-text-name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </FormField>
      <FormField label={t('fontType')} htmlFor="theme-text-font">
        <ThemeTokenSelect
          id="theme-text-font"
          value={values.fontId}
          noneLabel={tc('none')}
          options={theme.fonts.map((font) => ({ id: font.id, label: font.name || font.family }))}
          onChange={(fontId) => setValues({ ...values, fontId })}
        />
      </FormField>
      <FormField label={t('fontColor')} htmlFor="theme-text-color">
        <ThemeTokenSelect
          id="theme-text-color"
          value={values.colorId}
          noneLabel={tc('none')}
          options={theme.colors.map((color) => ({ id: color.id, label: color.name, swatch: color.value }))}
          onChange={(colorId) => setValues({ ...values, colorId })}
        />
      </FormField>
      <div className="grid grid-cols-5 gap-2">
        {WEBSITE_BREAKPOINTS.map((breakpoint) => (
          <FormField
            key={breakpoint}
            label={t(SIZE_LABEL_KEYS[breakpoint])}
            htmlFor={`theme-text-size-${breakpoint}`}
            error={fieldErrors[`sizeByBreakpoint.${breakpoint}`]}
          >
            <Input
              type="number"
              min={8}
              max={200}
              value={values.sizeByBreakpoint?.[breakpoint] ?? values.size}
              onChange={(event) => {
                const sizeByBreakpoint = {
                  ...defaultSizeByBreakpoint(values.size),
                  ...values.sizeByBreakpoint,
                  [breakpoint]: Number(event.target.value) || 16,
                }
                setValues({
                  ...values,
                  sizeByBreakpoint,
                  size: fallbackTextSize(sizeByBreakpoint),
                })
              }}
            />
          </FormField>
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-[hsl(var(--glass-border))] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t('preview')}</p>
          <Tabs
            value={previewBreakpoint}
            onValueChange={(value) => setPreviewBreakpoint(value as WebsiteBreakpoint)}
          >
            <TabsList className="h-8 w-auto min-w-0 px-0" aria-label={t('breakpoint')}>
              {WEBSITE_BREAKPOINTS.map((item) => (
                <TabsTrigger key={item} value={item} className="h-7 px-2 text-xs">
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <p
          className="truncate"
          style={{
            fontFamily: snap.fontFamily,
            fontSize: snap.size,
            color: snap.color,
            backgroundColor: theme.pageBackground,
          }}
        >
          {t('textPreviewSample')}
        </p>
      </div>
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
      title={isEdit ? t('editTextStyleTitle') : t('createTextStyleTitle')}
      description={isEdit ? undefined : t('createTextStyleDescription')}
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

function emptyTextStyle(theme: WebsiteTheme, initial?: WebsiteTextStyle): WebsiteTextStyle {
  if (initial) {
    return {
      ...initial,
      sizeByBreakpoint: {
        ...defaultSizeByBreakpoint(initial.size),
        ...initial.sizeByBreakpoint,
      },
    }
  }
  const sizeByBreakpoint = defaultSizeByBreakpoint(16)
  return {
    id: nanoid(8),
    name: '',
    fontId: theme.fonts[0]?.id ?? '',
    size: fallbackTextSize(sizeByBreakpoint),
    sizeByBreakpoint,
    colorId: theme.colors[0]?.id ?? '',
  }
}
