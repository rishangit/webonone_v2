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
import { Button, CustomDialog, Form, FormField, Input, mapZodIssuesToFieldErrors } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import { websiteButtonStyleSchema } from '../../schemas/websiteThemeSchemas'
import type { WebsiteButtonStyle, WebsiteTheme } from '../../types'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'
import { ThemeTokenSelect } from './ThemeTokenSelect'

function borderWidthForColor(borderColorId: string, current: number): number {
  if (!borderColorId) return 0
  return current > 0 ? current : 1
}

export function ThemeButtonStyleDialog({
  open,
  theme,
  initial,
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  theme: WebsiteTheme
  initial?: WebsiteButtonStyle
  onOpenChange: (open: boolean) => void
  onSubmit: (style: WebsiteButtonStyle) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [values, setValues] = useState<WebsiteButtonStyle>(emptyButtonStyle(theme, initial))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const colorOptions = theme.colors.map((color) => ({
    id: color.id,
    label: color.name,
    swatch: color.value,
  }))

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${theme.id}/buttons/${initial.id}`
      : `/embed/dialogs/website/themes/${theme.id}/buttons/create`,
    title: isEdit ? t('editButtonStyleTitle') : t('createButtonStyleTitle'),
    description: isEdit ? undefined : t('createButtonStyleDescription'),
    submitLabel: isEdit ? tc('save') : t('create'),
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: (payload) => {
      const parsed = websiteButtonStyleSchema.safeParse(payload)
      if (parsed.success) onSubmit(parsed.data)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setValues(emptyButtonStyle(theme, initial))
    setFieldErrors({})
  }, [chrome, initial, open, theme])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  function submit() {
    const parsed = websiteButtonStyleSchema.safeParse(values)
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

  const snap = resolveButtonStyle(theme, values)

  const body = (
    <Form className="space-y-4">
      <FormField label={t('name')} htmlFor="theme-button-name" required error={fieldErrors.name}>
        <Input
          id="theme-button-name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
      </FormField>
      <FormField label={t('textStyle')} htmlFor="theme-button-text-style">
        <ThemeTokenSelect
          id="theme-button-text-style"
          value={values.textStyleId}
          noneLabel={tc('none')}
          options={theme.textStyles.map((style) => ({ id: style.id, label: style.name }))}
          onChange={(textStyleId) => setValues({ ...values, textStyleId })}
        />
      </FormField>
      <FormField label={t('backgroundColor')} htmlFor="theme-button-bg">
        <ThemeTokenSelect
          id="theme-button-bg"
          value={values.backgroundColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(backgroundColorId) => setValues({ ...values, backgroundColorId })}
        />
      </FormField>
      <FormField label={t('fontColor')} htmlFor="theme-button-text-color">
        <ThemeTokenSelect
          id="theme-button-text-color"
          value={values.textColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(textColorId) => setValues({ ...values, textColorId })}
        />
      </FormField>
      <FormField label={t('borderColor')} htmlFor="theme-button-border">
        <ThemeTokenSelect
          id="theme-button-border"
          value={values.borderColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(borderColorId) =>
            setValues({
              ...values,
              borderColorId,
              borderWidth: borderWidthForColor(borderColorId, values.borderWidth),
            })
          }
        />
      </FormField>
      <FormField label={t('borderRadius')} htmlFor="theme-button-radius" error={fieldErrors.radius}>
        <Input
          id="theme-button-radius"
          type="number"
          min={0}
          max={999}
          value={values.radius}
          onChange={(event) => setValues({ ...values, radius: Number(event.target.value) || 0 })}
        />
      </FormField>
      <div className="rounded-lg border border-[hsl(var(--glass-border))] p-3">
        <p className="mb-2 text-xs text-muted-foreground">{t('preview')}</p>
        <span
          className="inline-flex items-center justify-center px-4 py-2"
          style={{
            ...buttonLabelTypography(),
            background: snap.background,
            color: snap.textColor,
            border: `${snap.borderWidth}px solid ${snap.borderColor}`,
            borderRadius: snap.radius,
            fontFamily: snap.fontFamily,
            fontSize: snap.fontSize,
          }}
        >
          {t('buttonPreviewLabel')}
        </span>
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
      title={isEdit ? t('editButtonStyleTitle') : t('createButtonStyleTitle')}
      description={isEdit ? undefined : t('createButtonStyleDescription')}
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

function emptyButtonStyle(theme: WebsiteTheme, initial?: WebsiteButtonStyle): WebsiteButtonStyle {
  if (initial) return initial
  return {
    id: nanoid(8),
    name: '',
    backgroundColorId: theme.colors[0]?.id ?? '',
    textColorId: theme.colors[1]?.id ?? theme.colors[0]?.id ?? '',
    textStyleId: theme.textStyles[0]?.id ?? '',
    borderColorId: '',
    borderWidth: 0,
    radius: 6,
  }
}
