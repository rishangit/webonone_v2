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
import { createTextLibrarySchema } from '../schemas/websiteThemeSchemas'
import {
  websiteColorLibraryActions,
  websiteFontLibraryActions,
  websiteTextLibraryCreateActions,
  websiteTextLibraryUpdateActions,
} from '../store'
import type { WebsiteTextLibraryItem } from '../types'
import { findColorOptionId, flattenColorLibraryPalettes } from '../utils/colorLibraryPalette'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'
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
  const [fontId, setFontId] = useState('')
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

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const next = item?.definition
    setName(item?.name ?? '')
    setFontId('')
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
  }, [chrome, dispatch, initialTab, item, open])

  useEffect(() => {
    if (!item) return
    const d = item.definition
    const font = fonts.items.find(
      (entry) => entry.googleFontUrl === d.googleFontUrl || entry.family === d.family,
    )
    if (font) setFontId(font.id)
    if (colorOptions.length > 0) {
      setColorOptionId(findColorOptionId(d.colorValue, colorOptions))
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
  const elementVisual = {
    color: previewBaseStyle.color,
    fontFamily: previewBaseStyle.fontFamily,
    fontSize: previewBaseStyle.fontSize,
  }
  const defaultHtml = defaultElementHtml('text', scopeId, elementVisual)

  const generalFields = (
    <Form className="space-y-4">
      <FormField label={t('styleName')} htmlFor="library-text-name" required error={fieldErrors.name}>
        <Input id="library-text-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('fontType')} htmlFor="library-text-font" required error={fieldErrors.library}>
        <Select value={fontId} onValueChange={setFontId}>
          <SelectTrigger id="library-text-font">
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
      <FormField label={t('fontColor')} htmlFor="library-text-color" required>
        <Select value={colorOptionId} onValueChange={setColorOptionId}>
          <SelectTrigger id="library-text-color">
            <SelectValue placeholder={t('pickColorRequired')} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((colorItem) => (
              <SelectItem key={colorItem.optionId} value={colorItem.optionId}>
                {colorItem.paletteName} · {t('paletteColorSlot', { index: colorItem.slot })} ({colorItem.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('sizeLg')} htmlFor="library-text-size" required error={fieldErrors['definition.size']}>
        <Input
          id="library-text-size"
          type="number"
          min={8}
          max={200}
          value={size}
          onChange={(event) => setSize(Number(event.target.value) || 16)}
        />
      </FormField>
    </Form>
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
