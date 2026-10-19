import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Save } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { createButtonLibrarySchema } from '../schemas/websiteThemeSchemas'
import {
  websiteButtonLibraryCreateActions,
  websiteButtonLibraryUpdateActions,
  websiteColorLibraryActions,
  websiteFontLibraryActions,
} from '../store'
import type { WebsiteButtonLibraryItem } from '../types'
import {
  findColorOptionId,
  flattenColorLibraryPalettes,
  formatPaletteScopedColorLabel,
  inferLibraryPaletteId,
  libraryPaletteColorValues,
  remapLibraryColorOptionId,
} from '../utils/colorLibraryPalette'
import { buttonLabelTypography } from '../document/theme'
import {
  defaultElementHtml,
  emptyWebsiteElementCustomization,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../utils/websiteElementCustomization'
import { ButtonStyleBasicSettingsFields } from './ButtonStyleBasicSettingsFields'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

function buttonLibraryDialogPath(itemId?: string, tab?: WebsiteElementEditorTab) {
  const path = itemId
    ? `/embed/dialogs/website/button-library/${itemId}`
    : '/embed/dialogs/website/button-library/create'
  return tab ? `${path}?tab=${encodeURIComponent(tab)}` : path
}

export function ButtonLibraryAddDialog({
  open,
  onOpenChange,
  item = null,
  initialTab,
  onSaved,
  chrome = 'dialog',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WebsiteButtonLibraryItem | null
  initialTab?: WebsiteElementEditorTab
  onSaved?: () => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const create = useAppSelector((state) => state.websiteButtonLibraryCreate)
  const update = useAppSelector((state) => state.websiteButtonLibraryUpdate)
  const fonts = useAppSelector((state) => state.websiteFontLibrary)
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const isEdit = Boolean(item)
  const saving = isEdit ? update.status === 'saving' : create.status === 'saving'
  const colorOptions = useMemo(() => flattenColorLibraryPalettes(colorLibrary.items), [colorLibrary.items])
  const [name, setName] = useState('')
  const [fontId, setFontId] = useState('')
  const [colorPaletteId, setColorPaletteId] = useState('')
  const [backgroundColorId, setBackgroundColorId] = useState('')
  const [textColorId, setTextColorId] = useState('')
  const [borderColorId, setBorderColorId] = useState('')
  const [textSize, setTextSize] = useState(18)
  const [borderWidth, setBorderWidth] = useState(0)
  const [radius, setRadius] = useState(6)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [customization, setCustomization] = useState(emptyWebsiteElementCustomization())
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>(initialTab ?? 'preview')
  const [draftId, setDraftId] = useState(() => nanoid())
  const scopeId = item?.id ?? draftId
  const title = isEdit ? t('editButtonLibraryTitle') : t('addButtonToLibraryTitle')
  const description = isEdit ? t('editButtonLibraryDescription') : t('addButtonToLibraryDescription')
  const submitLabel = isEdit ? tc('save') : tc('save')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: buttonLibraryDialogPath(item?.id, initialTab),
    title,
    description,
    submitLabel,
    ...WEBSITE_PAGE_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onSaved?.()
    },
    onCancel: () => onOpenChange(false),
  })

  const editSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    if (!open) {
      editSessionRef.current = null
      return
    }

    const sessionKey = `${item?.id ?? 'create'}:${initialTab ?? 'preview'}`
    if (editSessionRef.current === sessionKey) return
    editSessionRef.current = sessionKey

    const next = item?.definition

    setName(item?.name ?? '')
    setFontId('')
    setColorPaletteId('')
    setBackgroundColorId('')
    setTextColorId('')
    setBorderColorId('')
    setTextSize(next?.textSize ?? 18)
    setBorderWidth(next?.borderWidth ?? 0)
    setRadius(next?.radius ?? 6)
    setCustomization(
      next ? normalizeWebsiteElementCustomization(next.customization) : emptyWebsiteElementCustomization(),
    )
    setElementTab(initialTab ?? 'preview')
    if (!item) setDraftId(nanoid())
    setFieldErrors({})
    dispatch(websiteButtonLibraryCreateActions.createReset())
    dispatch(websiteButtonLibraryUpdateActions.updateReset())
    dispatch(websiteFontLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteColorLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the edit session opens, not when the list refreshes the same item
  }, [chrome, dispatch, initialTab, item?.id, open])

  useEffect(() => {
    if (open && !item && !colorPaletteId && colorLibrary.items[0]) {
      setColorPaletteId(colorLibrary.items[0].id)
    }
    if (!open || !item?.id) return
    if (editSessionRef.current !== `${item.id}:${initialTab ?? 'preview'}`) return
    if (fontId && backgroundColorId && textColorId && borderColorId) return
    const d = item.definition
    const font = fonts.items.find(
      (entry) => entry.googleFontUrl === d.textGoogleFontUrl || entry.family === d.textFontFamily,
    )
    if (font && !fontId) setFontId(font.id)
    if (colorOptions.length > 0) {
      const nextBackground = backgroundColorId || findColorOptionId(d.backgroundColorValue, colorOptions)
      const nextText =
        textColorId ||
        findColorOptionId(d.labelColorValue, colorOptions) ||
        findColorOptionId(d.textColorValue, colorOptions)
      const nextBorder = borderColorId || findColorOptionId(d.borderColorValue, colorOptions)
      if (!backgroundColorId) setBackgroundColorId(nextBackground)
      if (!textColorId) setTextColorId(nextText)
      if (!borderColorId) setBorderColorId(nextBorder)
      if (!colorPaletteId) {
        setColorPaletteId(inferLibraryPaletteId(colorOptions, [nextBackground, nextText, nextBorder]))
      }
    }
  }, [
    backgroundColorId,
    borderColorId,
    colorLibrary.items,
    colorOptions,
    colorPaletteId,
    fontId,
    fonts.items,
    initialTab,
    item,
    open,
    textColorId,
  ])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, saving)
  }, [dialogRequestId, parentOrigin, saving])

  useEffect(() => {
    const status = isEdit ? update.status : create.status
    const error = isEdit ? update.error : create.error
    if (status === 'succeeded') {
      toast({ title: isEdit ? t('buttonLibraryUpdated') : t('buttonLibraryAdded') })
      dispatch(websiteButtonLibraryCreateActions.createReset())
      dispatch(websiteButtonLibraryUpdateActions.updateReset())
      if (dialogRequestId && parentOrigin) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId)
      }
      onOpenChange(false)
      onSaved?.()
    }
    if (status === 'error') {
      toast({
        title: t('buttonLibrarySaveFailed'),
        description: error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteButtonLibraryCreateActions.createReset())
      dispatch(websiteButtonLibraryUpdateActions.updateReset())
    }
  }, [
    create.error,
    create.status,
    dialogRequestId,
    dispatch,
    isEdit,
    onOpenChange,
    onSaved,
    parentOrigin,
    t,
    toast,
    update.error,
    update.status,
  ])

  function submit() {
    const font = fonts.items.find((entry) => entry.id === fontId)
    const background = colorOptions.find((entry) => entry.optionId === backgroundColorId)
    const textColor = colorOptions.find((entry) => entry.optionId === textColorId)
    const borderColor = colorOptions.find((entry) => entry.optionId === borderColorId)
    if (!font || !background || !textColor || !borderColor) {
      const message = t('pickButtonLibraryFieldsRequired')
      setFieldErrors({ library: message })
      setElementTab('general')
      toast({ title: t('saveFailed'), description: message, variant: 'destructive' })
      return
    }
    const textColorName = `${textColor.paletteName} (${t('paletteColorSlot', { index: textColor.slot })})`
    const finalizedCustomization = finalizeElementCustomization(
      customization,
      defaultElementHtml('button', scopeId, {
        background: background.value,
        color: textColor.value,
        border: `${borderWidth}px solid ${borderColor.value}`,
        borderRadius: radius,
        fontFamily: font.family,
        fontSize: textSize,
        lineHeight: 1,
      }),
      scopeId,
    )
    const parsed = createButtonLibrarySchema.safeParse({
      name: name.trim(),
      definition: {
        backgroundColorName: `${background.paletteName} (${t('paletteColorSlot', { index: background.slot })})`,
        backgroundColorValue: background.value,
        textColorName,
        textColorValue: textColor.value,
        borderColorName: `${borderColor.paletteName} (${t('paletteColorSlot', { index: borderColor.slot })})`,
        borderColorValue: borderColor.value,
        borderWidth,
        radius,
        textStyleName: `${name.trim() || 'Button'} label`,
        textFontName: font.name,
        textGoogleFontUrl: font.googleFontUrl,
        textFontFamily: font.family,
        textSize,
        labelColorName: textColorName,
        labelColorValue: textColor.value,
        ...(hasElementCustomization(finalizedCustomization) ? { customization: finalizedCustomization } : {}),
      },
    })
    if (!parsed.success) {
      const errors = mapZodIssuesToFieldErrors(parsed.error.issues)
      setFieldErrors(errors)
      setElementTab('general')
      toast({
        title: t('saveFailed'),
        description: Object.values(errors)[0] ?? t('buttonLibrarySaveFailed'),
        variant: 'destructive',
      })
      return
    }
    setFieldErrors({})
    if (item) {
      dispatch(websiteButtonLibraryUpdateActions.updateRequested({ id: item.id, ...parsed.data }))
      return
    }
    dispatch(websiteButtonLibraryCreateActions.createRequested(parsed.data))
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const previewLabel = t('buttonPreviewLabel')
  const background = colorOptions.find((entry) => entry.optionId === backgroundColorId)
  const textColor = colorOptions.find((entry) => entry.optionId === textColorId)
  const borderColor = colorOptions.find((entry) => entry.optionId === borderColorId)
  const font = fonts.items.find((entry) => entry.id === fontId)
  const previewBaseStyle = {
    ...buttonLabelTypography(),
    background: background?.value ?? '#111827',
    color: textColor?.value ?? '#ffffff',
    border: `${borderWidth}px solid ${borderColor?.value ?? 'transparent'}`,
    borderRadius: radius,
    fontFamily: font?.family ?? 'inherit',
    fontSize: textSize,
  }
  const elementVisual = withPaletteColors(
    {
      background: previewBaseStyle.background,
      color: previewBaseStyle.color,
      border: previewBaseStyle.border,
      borderRadius: previewBaseStyle.borderRadius,
      fontFamily: previewBaseStyle.fontFamily,
      fontSize: previewBaseStyle.fontSize,
      lineHeight: 1,
    },
    libraryPaletteColorValues(colorLibrary.items, colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('button', scopeId, elementVisual)

  const generalFields = (
    <ButtonStyleBasicSettingsFields
      mode="edit"
      idPrefix="library-button"
      values={{
        name,
        fontId,
        colorPaletteId,
        backgroundColorId,
        textColorId,
        borderColorId,
        textSize,
        borderWidth,
        radius,
      }}
      onChange={(next) => {
        const paletteId = next.colorPaletteId || colorPaletteId
        setName(next.name)
        setFontId(next.fontId)
        setColorPaletteId(paletteId)
        setBackgroundColorId(
          paletteId === colorPaletteId
            ? next.backgroundColorId
            : remapLibraryColorOptionId(colorOptions, paletteId, next.backgroundColorId),
        )
        setTextColorId(
          paletteId === colorPaletteId
            ? next.textColorId
            : remapLibraryColorOptionId(colorOptions, paletteId, next.textColorId),
        )
        setBorderColorId(
          paletteId === colorPaletteId
            ? next.borderColorId
            : remapLibraryColorOptionId(colorOptions, paletteId, next.borderColorId),
        )
        setTextSize(next.textSize)
        setBorderWidth(next.borderWidth)
        setRadius(next.radius)
      }}
      fieldErrors={fieldErrors}
      extraError={fieldErrors.library}
      fontOptions={fonts.items.map((fontItem) => ({
        id: fontItem.id,
        label: fontItem.name,
        fontFamily: fontItem.family,
      }))}
      paletteOptions={colorLibrary.items.map((item) => ({
        id: item.id,
        name: item.name,
        palette: item.palette,
      }))}
      colorOptions={colorOptions
        .filter((color) => !colorPaletteId || color.paletteId === colorPaletteId)
        .map((color) => ({
          id: color.optionId,
          label: formatPaletteScopedColorLabel(color, t('paletteColorSlot', { index: color.slot })),
          swatch: color.value,
        }))}
      fontPlaceholder={t('pickFontRequired')}
      colorPlaceholder={t('pickColorRequired')}
    />
  )

  const body = (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={setElementTab}
      kind="button"
      scopeId={scopeId}
      customization={customization}
      defaultHtml={defaultHtml}
      visual={elementVisual}
      onCustomizationChange={setCustomization}
      preview={
        <WebsiteElementCustomizationPreview
          scopeId={scopeId}
          kind="button"
          customization={customization}
          placeholders={{ label: previewLabel }}
          defaultHtml={defaultHtml}
          visual={elementVisual}
          baseStyle={previewBaseStyle}
          className="inline-flex"
          fallback={
            <span className="inline-flex items-center justify-center px-4 py-2" style={previewBaseStyle}>
              {previewLabel}
            </span>
          }
        />
      }
      general={generalFields}
    />
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
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saving ? (isEdit ? t('saving') : t('creating')) : submitLabel}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
