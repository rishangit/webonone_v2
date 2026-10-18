import { useEffect, useMemo, useState } from 'react'
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
  Form,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  type FlattenedLibraryColor,
} from '../utils/colorLibraryPalette'
import { buttonLabelTypography } from '../document/theme'
import {
  defaultElementHtml,
  emptyWebsiteElementCustomization,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
} from '../utils/websiteElementCustomization'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

function colorOptionLabel(color: FlattenedLibraryColor, slotLabel: string) {
  return `${color.paletteName} · ${slotLabel} (${color.value})`
}

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
  const [backgroundColorId, setBackgroundColorId] = useState('')
  const [textColorId, setTextColorId] = useState('')
  const [borderColorId, setBorderColorId] = useState('')
  const [labelColorId, setLabelColorId] = useState('')
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

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const next = item?.definition
    setName(item?.name ?? '')
    setFontId('')
    setBackgroundColorId('')
    setTextColorId('')
    setBorderColorId('')
    setLabelColorId('')
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
  }, [chrome, dispatch, initialTab, item, open])

  useEffect(() => {
    if (!item) return
    const d = item.definition
    const font = fonts.items.find(
      (entry) => entry.googleFontUrl === d.textGoogleFontUrl || entry.family === d.textFontFamily,
    )
    if (font) setFontId(font.id)
    if (colorOptions.length > 0) {
      setBackgroundColorId(findColorOptionId(d.backgroundColorValue, colorOptions))
      setTextColorId(findColorOptionId(d.textColorValue, colorOptions))
      setBorderColorId(findColorOptionId(d.borderColorValue, colorOptions))
      setLabelColorId(findColorOptionId(d.labelColorValue, colorOptions))
    }
  }, [colorOptions, fonts.items, item])

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
    const labelColor = colorOptions.find((entry) => entry.optionId === labelColorId)
    if (!font || !background || !textColor || !borderColor || !labelColor) {
      setFieldErrors({ library: t('pickButtonLibraryFieldsRequired') })
      return
    }
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
        textColorName: `${textColor.paletteName} (${t('paletteColorSlot', { index: textColor.slot })})`,
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
        labelColorName: `${labelColor.paletteName} (${t('paletteColorSlot', { index: labelColor.slot })})`,
        labelColorValue: labelColor.value,
        ...(hasElementCustomization(finalizedCustomization) ? { customization: finalizedCustomization } : {}),
      },
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
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
  const elementVisual = {
    background: previewBaseStyle.background,
    color: previewBaseStyle.color,
    border: previewBaseStyle.border,
    borderRadius: previewBaseStyle.borderRadius,
    fontFamily: previewBaseStyle.fontFamily,
    fontSize: previewBaseStyle.fontSize,
    lineHeight: 1,
  }
  const defaultHtml = defaultElementHtml('button', scopeId, elementVisual)

  const generalFields = (
    <Form className="space-y-4">
      <FormField label={t('styleName')} htmlFor="library-button-name" required error={fieldErrors.name}>
        <Input id="library-button-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      {fieldErrors.library ? (
        <p className="text-sm text-destructive" role="alert">{fieldErrors.library}</p>
      ) : null}
      <FormField label={t('fontType')} htmlFor="library-button-font" required>
        <Select value={fontId} onValueChange={setFontId}>
          <SelectTrigger id="library-button-font">
            <SelectValue placeholder={t('pickFontRequired')} />
          </SelectTrigger>
          <SelectContent>
            {fonts.items.map((fontItem) => (
              <SelectItem key={fontItem.id} value={fontItem.id}>
                {fontItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('backgroundColor')} htmlFor="library-button-bg" required>
        <Select value={backgroundColorId} onValueChange={setBackgroundColorId}>
          <SelectTrigger id="library-button-bg">
            <SelectValue placeholder={t('pickColorRequired')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.optionId} value={color.optionId}>
                {colorOptionLabel(color, t('paletteColorSlot', { index: color.slot }))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('textColor')} htmlFor="library-button-text" required>
        <Select value={textColorId} onValueChange={setTextColorId}>
          <SelectTrigger id="library-button-text">
            <SelectValue placeholder={t('pickColorRequired')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.optionId} value={color.optionId}>
                {colorOptionLabel(color, t('paletteColorSlot', { index: color.slot }))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('labelTextColor')} htmlFor="library-button-label" required>
        <Select value={labelColorId} onValueChange={setLabelColorId}>
          <SelectTrigger id="library-button-label">
            <SelectValue placeholder={t('pickColorRequired')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.optionId} value={color.optionId}>
                {colorOptionLabel(color, t('paletteColorSlot', { index: color.slot }))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('borderColor')} htmlFor="library-button-border" required>
        <Select value={borderColorId} onValueChange={setBorderColorId}>
          <SelectTrigger id="library-button-border">
            <SelectValue placeholder={t('pickColorRequired')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.optionId} value={color.optionId}>
                {colorOptionLabel(color, t('paletteColorSlot', { index: color.slot }))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label={t('textSize')} htmlFor="library-button-size">
          <Input
            id="library-button-size"
            type="number"
            min={8}
            max={200}
            value={textSize}
            onChange={(event) => setTextSize(Number(event.target.value) || 18)}
          />
        </FormField>
        <FormField label={t('borderWidth')} htmlFor="library-button-border-width">
          <Input
            id="library-button-border-width"
            type="number"
            min={0}
            max={16}
            value={borderWidth}
            onChange={(event) => setBorderWidth(Number(event.target.value) || 0)}
          />
        </FormField>
        <FormField label={t('radius')} htmlFor="library-button-radius">
          <Input
            id="library-button-radius"
            type="number"
            min={0}
            max={999}
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value) || 0)}
          />
        </FormField>
      </div>
    </Form>
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
