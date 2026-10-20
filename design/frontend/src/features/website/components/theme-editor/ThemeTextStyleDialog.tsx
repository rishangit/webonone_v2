import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Check } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { fallbackTextSize, resolveTextStyle } from '../../document/theme'
import { websiteTextStyleSchema } from '../../schemas/websiteThemeSchemas'
import { websiteTextLibraryActions } from '../../store'
import { type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../../types'
import {
  materializeTextLibraryItem,
  type ThemeTokenPatch,
} from '../../utils/themeLibraryMaterialize'
import { mapThemeFieldErrors } from '../../utils/mapThemeFieldErrors'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'
import {
  defaultElementHtml,
  emptyWebsiteElementCustomization,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
} from '../../utils/websiteElementCustomization'
import { defaultSizeByBreakpoint } from './textStyleDefaults'
import { ThemeStyleLibraryChoice, ThemeStyleLibraryList } from './ThemeStyleLibraryCreateShell'
import { ThemeTextStyleEditPanel } from './ThemeTextStyleEditPanel'
import type { WebsiteElementEditorTab } from '../WebsiteElementEditorTabs'
import { themeFontFamilyStyle } from '../../utils/themeFontPreview'
type TextSource = 'library' | 'custom'

const TEXT_LIBRARY_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

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
  onSubmit: (style: WebsiteTextStyle, patch?: ThemeTokenPatch) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const textLibrary = useAppSelector((state) => state.websiteTextLibrary)
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [choice, setChoice] = useState<TextSource | null>(null)
  const [source, setSource] = useState<TextSource | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [values, setValues] = useState<WebsiteTextStyle>(emptyTextStyle(theme, initial))
  const [previewBreakpoint, setPreviewBreakpoint] = useState<WebsiteBreakpoint>('lg')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>('preview')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const dialogSize = isEdit ? WEBSITE_PAGE_DIALOG_SIZE : TEXT_LIBRARY_DIALOG_SIZE
  const choosing = !isEdit && source === null
  const selected = textLibrary.items.find((item) => item.id === selectedId) ?? null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${theme.id}/texts/${initial.id}`
      : `/embed/dialogs/website/themes/${theme.id}/texts/create`,
    title: isEdit ? t('editTextStyleTitle') : t('createTextStyleTitle'),
    description: isEdit ? undefined : t('createTextStyleDescription'),
    submitLabel: isEdit ? tc('save') : choosing ? tc('next') : t('create'),
    ...dialogSize,
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
    setChoice(null)
    setSource(null)
    setSelectedId(null)
    setElementTab('preview')
  }, [chrome, initial, open, theme])

  useEffect(() => {
    if (isEdit || source !== 'library' || (!open && chrome === 'dialog')) return
    dispatch(websiteTextLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [chrome, dispatch, isEdit, open, source])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    const waitingForChoice = choosing ? !choice : source === 'library' && !selected
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      waitingForChoice,
      isEdit ? tc('save') : choosing ? tc('next') : t('create'),
      { secondaryLabel: choosing || isEdit ? null : tc('previous') },
    )
  }, [choice, choosing, dialogRequestId, isEdit, parentOrigin, selected, source, t, tc])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, false)
  }, [dialogRequestId, parentOrigin])

  function confirmChoice() {
    if (!choice) return
    setSource(choice)
    setFieldErrors({})
  }

  function backToChoice() {
    setSource(null)
    setFieldErrors({})
  }

  function submit() {
    if (isEdit) {
      const snap = resolveTextStyle(theme, values, previewBreakpoint)
      const customization = finalizeElementCustomization(
        normalizeWebsiteElementCustomization(values.customization),
        defaultElementHtml('text', values.id, {
          color: snap.color,
          fontFamily: snap.fontFamily,
          fontSize: snap.size,
        }),
        values.id,
      )
      const parsed = websiteTextStyleSchema.safeParse({
        ...values,
        size: fallbackTextSize(values.sizeByBreakpoint),
        customization: hasElementCustomization(customization) ? customization : undefined,
      })
      if (!parsed.success) {
        setFieldErrors(mapThemeFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      onSubmit(parsed.data)
      return
    }

    if (source === 'library') {
      if (!selected) {
        setFieldErrors({ library: t('pickTextStyleRequired') })
        return
      }
      const { textStyle, patch } = materializeTextLibraryItem(theme, selected)
      setFieldErrors({})
      onSubmit(textStyle, patch)
      onOpenChange(false)
      return
    }

    if (source !== 'custom') return

    const snap = resolveTextStyle(theme, values, previewBreakpoint)
    const customization = finalizeElementCustomization(
      normalizeWebsiteElementCustomization(values.customization),
      defaultElementHtml('text', values.id, {
        color: snap.color,
        fontFamily: snap.fontFamily,
        fontSize: snap.size,
      }),
      values.id,
    )
    const parsed = websiteTextStyleSchema.safeParse({
      ...values,
      size: fallbackTextSize(values.sizeByBreakpoint),
      customization: hasElementCustomization(customization) ? customization : undefined,
    })
    if (!parsed.success) {
      setFieldErrors(mapThemeFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  function handlePrimary() {
    if (choosing) {
      confirmChoice()
      return
    }
    submit()
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: handlePrimary,
    onSecondary: backToChoice,
  })

  const customBody = (
    <ThemeTextStyleEditPanel
      theme={theme}
      values={values}
      onValuesChange={setValues}
      fieldErrors={fieldErrors}
      elementTab={elementTab}
      onElementTabChange={setElementTab}
      previewBreakpoint={previewBreakpoint}
      onPreviewBreakpointChange={setPreviewBreakpoint}
    />
  )

  const body = isEdit
    ? customBody
    : choosing
      ? (
          <ThemeStyleLibraryChoice
            ariaLabel={t('addTextSource')}
            libraryTitle={t('addTextFromLibrary')}
            libraryHint={t('addTextLibraryHint')}
            customTitle={t('addTextCustom')}
            customHint={t('addTextCustomHint')}
            choice={choice}
            onChoice={setChoice}
          />
        )
      : source === 'library'
        ? (
            <ThemeStyleLibraryList
              hint={t('pickTextStyleHint')}
              fieldError={fieldErrors.library}
              listStatus={textLibrary.listStatus}
              listError={textLibrary.listError}
              items={textLibrary.items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyLabel={t('textLibraryEmptySuperAdmin')}
              renderItem={(item, selectedRow) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p
                      className="truncate text-sm text-muted-foreground"
                      style={themeFontFamilyStyle(item.definition.family)}
                    >
                      {item.definition.fontName} · {item.definition.size}px
                    </p>
                  </div>
                  {selectedRow ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                </div>
              )}
            />
          )
        : customBody

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
      sizeWidth={dialogSize.sizeWidth}
      sizeHeight={dialogSize.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            onClick={() => {
              if (!isEdit && source !== null) {
                backToChoice()
                return
              }
              onOpenChange(false)
            }}
          >
            {!isEdit && source !== null ? tc('previous') : tc('cancel')}
          </Button>
          <Button type="button" className={cn('h-10 px-4')} onClick={handlePrimary}>
            {isEdit ? tc('save') : choosing ? tc('next') : t('create')}
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
      customization: normalizeWebsiteElementCustomization(initial.customization),
    }
  }
  const sizeByBreakpoint = defaultSizeByBreakpoint(16)
  return {
    id: nanoid(8),
    name: '',
    fontId: theme.fonts[0]?.id ?? '',
    size: fallbackTextSize(sizeByBreakpoint),
    sizeByBreakpoint,
    colorIndex: 1,
    colorPaletteId: null,
    customization: emptyWebsiteElementCustomization(),
  }
}
