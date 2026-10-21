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
import { Button, CustomDialog, mapZodIssuesToFieldErrors, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { createTextLibrarySchema } from '../schemas/websiteThemeSchemas'
import { usableLibraryItems, WebsitePublishStatusField } from './WebsitePublishStatus'
import {
  websiteColorLibraryActions,
  websiteFontLibraryActions,
  websiteTextLibraryCreateActions,
  websiteTextLibraryUpdateActions,
} from '../store'
import type { WebsiteTextLibraryItem } from '../types'
import {
  findColorOptionId,
  flattenColorLibraryPalettes,
  formatPaletteScopedColorLabel,
  inferLibraryPaletteId,
  libraryPaletteColorValues,
  remapLibraryColorOptionId,
} from '../utils/colorLibraryPalette'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'
import {
  defaultElementHtml,
  emptyWebsiteElementCustomization,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../utils/websiteElementCustomization'
import { TextStyleBasicSettingsFields } from './TextStyleBasicSettingsFields'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'
import { WEBSITE_PAGE_DIALOG_SIZE } from './WebsiteEntityDialogs'

function textLibraryDialogPath(itemId?: string, tab?: WebsiteElementEditorTab) {
  const path = itemId
    ? `/embed/dialogs/website/text-library/${itemId}`
    : '/embed/dialogs/website/text-library/create'
  return tab ? `${path}?tab=${encodeURIComponent(tab)}` : path
}

export function TextLibraryAddDialog({
  open,
  onOpenChange,
  item = null,
  initialTab,
  onSaved,
  chrome = 'dialog',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WebsiteTextLibraryItem | null
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
  const create = useAppSelector((state) => state.websiteTextLibraryCreate)
  const update = useAppSelector((state) => state.websiteTextLibraryUpdate)
  const fonts = useAppSelector((state) => state.websiteFontLibrary)
  const colors = useAppSelector((state) => state.websiteColorLibrary)
  const isEdit = Boolean(item)
  const saving = isEdit ? update.status === 'saving' : create.status === 'saving'
  const colorOptions = useMemo(() => flattenColorLibraryPalettes(colors.items), [colors.items])
  const [name, setName] = useState('')
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft')
  const [fontId, setFontId] = useState('')
  const [colorPaletteId, setColorPaletteId] = useState('')
  const [colorOptionId, setColorOptionId] = useState('')
  const [size, setSize] = useState(16)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [customization, setCustomization] = useState(emptyWebsiteElementCustomization())
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>(initialTab ?? 'preview')
  const [draftId, setDraftId] = useState(() => nanoid())
  const scopeId = item?.id ?? draftId
  const title = isEdit ? t('editTextLibraryTitle') : t('addTextToLibraryTitle')
  const description = isEdit ? t('editTextLibraryDescription') : t('addTextToLibraryDescription')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: textLibraryDialogPath(item?.id, initialTab),
    title,
    description,
    submitLabel: tc('save'),
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
    setPublishStatus(item?.publishStatus ?? 'draft')
    setFontId('')
    setColorPaletteId('')
    setColorOptionId('')
    setSize(next?.size ?? 16)
    setCustomization(
      next ? normalizeWebsiteElementCustomization(next.customization) : emptyWebsiteElementCustomization(),
    )
    setElementTab(initialTab ?? 'preview')
    if (!item) setDraftId(nanoid())
    setFieldErrors({})
    dispatch(websiteTextLibraryCreateActions.createReset())
    dispatch(websiteTextLibraryUpdateActions.updateReset())
    dispatch(websiteFontLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteColorLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the edit session opens, not when the list refreshes the same item
  }, [chrome, dispatch, initialTab, item?.id, open])

  useEffect(() => {
    if (open && !item && !colorPaletteId && colors.items[0]) {
      setColorPaletteId(colors.items[0].id)
    }
    if (!open || !item?.id) return
    if (editSessionRef.current !== `${item.id}:${initialTab ?? 'preview'}`) return
    if (fontId && colorOptionId && colorPaletteId) return
    const d = item.definition
    const font = fonts.items.find(
      (entry) => entry.googleFontUrl === d.googleFontUrl || entry.family === d.family,
    )
    if (font && !fontId) setFontId(font.id)
    if (colorOptions.length > 0) {
      const nextColor = colorOptionId || findColorOptionId(d.colorValue, colorOptions)
      if (!colorOptionId) setColorOptionId(nextColor)
      if (!colorPaletteId) setColorPaletteId(inferLibraryPaletteId(colorOptions, [nextColor]))
    }
  }, [
    colorOptionId,
    colorOptions,
    colorPaletteId,
    colors.items,
    fontId,
    fonts.items,
    initialTab,
    item,
    open,
  ])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, saving)
  }, [dialogRequestId, parentOrigin, saving])

  useEffect(() => {
    const status = isEdit ? update.status : create.status
    const error = isEdit ? update.error : create.error
    if (status === 'succeeded') {
      toast({ title: isEdit ? t('textLibraryUpdated') : t('textLibraryAdded') })
      dispatch(websiteTextLibraryCreateActions.createReset())
      dispatch(websiteTextLibraryUpdateActions.updateReset())
      if (dialogRequestId && parentOrigin) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId)
      }
      onOpenChange(false)
      onSaved?.()
    }
    if (status === 'error') {
      toast({
        title: t('textLibrarySaveFailed'),
        description: error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteTextLibraryCreateActions.createReset())
      dispatch(websiteTextLibraryUpdateActions.updateReset())
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
    const color = colorOptions.find((entry) => entry.optionId === colorOptionId)
    if (!font || !color) {
      setFieldErrors({ library: t('pickFontAndColorRequired') })
      return
    }
    const finalizedCustomization = finalizeElementCustomization(
      customization,
      defaultElementHtml('text', scopeId, {
        color: color.value,
        fontFamily: font.family,
        fontSize: size,
      }),
      scopeId,
    )
    const parsed = createTextLibrarySchema.safeParse({
      name: name.trim(),
      publishStatus,
      definition: {
        fontName: font.name,
        googleFontUrl: font.googleFontUrl,
        family: font.family,
        colorName: `${color.paletteName} (${t('paletteColorSlot', { index: color.slot })})`,
        colorValue: color.value,
        size,
        ...(hasElementCustomization(finalizedCustomization) ? { customization: finalizedCustomization } : {}),
      },
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    if (item) {
      dispatch(websiteTextLibraryUpdateActions.updateRequested({ id: item.id, ...parsed.data }))
      return
    }
    dispatch(websiteTextLibraryCreateActions.createRequested(parsed.data))
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: submit,
  })

  const previewSample = t('textPreviewSample')
  const font = fonts.items.find((entry) => entry.id === fontId)
  const color = colorOptions.find((entry) => entry.optionId === colorOptionId)
  const previewBaseStyle = {
    fontFamily: font?.family ?? 'inherit',
    fontSize: size,
    color: color?.value ?? '#111827',
  }
  const elementVisual = withPaletteColors(
    {
      color: previewBaseStyle.color,
      fontFamily: previewBaseStyle.fontFamily,
      fontSize: previewBaseStyle.fontSize,
    },
    libraryPaletteColorValues(colors.items, colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('text', scopeId, elementVisual)

  const generalFields = (
    <>
    <WebsitePublishStatusField
      id="library-text-publish"
      value={publishStatus}
      disabled={saving}
      onChange={setPublishStatus}
    />
    <TextStyleBasicSettingsFields
      mode="edit"
      idPrefix="library-text"
      values={{
        name,
        fontId,
        colorPaletteId,
        colorId: colorOptionId,
        size,
      }}
      onChange={(next) => {
        const paletteId = next.colorPaletteId || colorPaletteId
        setName(next.name)
        setFontId(next.fontId)
        setColorPaletteId(paletteId)
        setColorOptionId(
          paletteId === colorPaletteId
            ? next.colorId
            : remapLibraryColorOptionId(colorOptions, paletteId, next.colorId),
        )
        setSize(next.size)
      }}
      fieldErrors={{
        name: fieldErrors.name,
        fontId: fieldErrors.fontId,
        colorPaletteId: fieldErrors.colorPaletteId,
        colorId: fieldErrors.colorId,
        size: fieldErrors.size ?? fieldErrors['definition.size'],
      }}
      extraError={fieldErrors.library}
      fontOptions={usableLibraryItems(fonts.items, [fontId]).map((fontItem) => ({
        id: fontItem.id,
        label: fontItem.name,
        fontFamily: fontItem.family,
      }))}
      paletteOptions={usableLibraryItems(colors.items, [colorPaletteId]).map((libraryItem) => ({
        id: libraryItem.id,
        name: libraryItem.name,
        palette: libraryItem.palette,
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
    </>
  )

  const body = (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={setElementTab}
      kind="text"
      scopeId={scopeId}
      customization={customization}
      defaultHtml={defaultHtml}
      visual={elementVisual}
      onCustomizationChange={setCustomization}
      preview={
        <WebsiteElementCustomizationPreview
          scopeId={scopeId}
          kind="text"
          customization={customization}
          placeholders={{ content: previewSample }}
          defaultHtml={defaultHtml}
          visual={elementVisual}
          baseStyle={previewBaseStyle}
          className="min-h-[2rem] whitespace-pre-wrap"
          fallback={
            <p className="truncate" style={{ ...previewBaseStyle, ...themeFontFamilyStyle(font?.family ?? '') }}>
              {previewSample}
            </p>
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
            {saving ? (isEdit ? t('saving') : t('creating')) : tc('save')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
