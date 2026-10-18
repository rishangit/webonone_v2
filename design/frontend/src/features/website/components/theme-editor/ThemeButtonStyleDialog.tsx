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
import { Button, CustomDialog, cn, mapZodIssuesToFieldErrors } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { resolveButtonStyle } from '../../document/theme'
import { websiteButtonStyleSchema } from '../../schemas/websiteThemeSchemas'
import { websiteButtonLibraryActions } from '../../store'
import type { WebsiteButtonStyle, WebsiteTheme } from '../../types'
import {
  materializeButtonLibraryItem,
  type ThemeTokenPatch,
} from '../../utils/themeLibraryMaterialize'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'
import {
  buttonVisualFromResolved,
  defaultElementHtml,
  emptyWebsiteElementCustomization,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
} from '../../utils/websiteElementCustomization'
import type { WebsiteElementEditorTab } from '../WebsiteElementEditorTabs'
import { ThemeButtonStyleEditPanel } from './ThemeButtonStyleEditPanel'
import { ThemeStyleLibraryChoice, ThemeStyleLibraryList } from './ThemeStyleLibraryCreateShell'

function themeButtonDialogPath(themeId: string, styleId?: string, tab?: WebsiteElementEditorTab) {
  const path = styleId
    ? `/embed/dialogs/website/themes/${themeId}/buttons/${styleId}`
    : `/embed/dialogs/website/themes/${themeId}/buttons/create`
  return tab ? `${path}?tab=${encodeURIComponent(tab)}` : path
}

type ButtonSource = 'library' | 'custom'

const BUTTON_LIBRARY_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

export function ThemeButtonStyleDialog({
  open,
  theme,
  initial,
  initialTab,
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  theme: WebsiteTheme
  initial?: WebsiteButtonStyle
  initialTab?: WebsiteElementEditorTab
  onOpenChange: (open: boolean) => void
  onSubmit: (style: WebsiteButtonStyle, patch?: ThemeTokenPatch) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const buttonLibrary = useAppSelector((state) => state.websiteButtonLibrary)
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [choice, setChoice] = useState<ButtonSource | null>(null)
  const [source, setSource] = useState<ButtonSource | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [values, setValues] = useState<WebsiteButtonStyle>(emptyButtonStyle(theme, initial))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>(initialTab ?? 'preview')
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const dialogSize = isEdit ? WEBSITE_PAGE_DIALOG_SIZE : BUTTON_LIBRARY_DIALOG_SIZE
  const choosing = !isEdit && source === null
  const selected = buttonLibrary.items.find((item) => item.id === selectedId) ?? null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: themeButtonDialogPath(theme.id, initial?.id, initialTab),
    title: isEdit ? t('editButtonStyleTitle') : t('createButtonStyleTitle'),
    description: isEdit ? undefined : t('createButtonStyleDescription'),
    submitLabel: isEdit ? tc('save') : choosing ? tc('next') : t('create'),
    ...dialogSize,
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
    setChoice(null)
    setSource(null)
    setSelectedId(null)
    setElementTab(initialTab ?? 'preview')
  }, [chrome, initial, initialTab, open, theme])

  useEffect(() => {
    if (isEdit || source !== 'library' || (!open && chrome === 'dialog')) return
    dispatch(websiteButtonLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
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
      const customization = finalizeElementCustomization(
        normalizeWebsiteElementCustomization(values.customization),
        defaultElementHtml('button', values.id, buttonVisualFromResolved(resolveButtonStyle(theme, values))),
        values.id,
      )
      const parsed = websiteButtonStyleSchema.safeParse({
        ...values,
        customization: hasElementCustomization(customization) ? customization : undefined,
      })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      onSubmit(parsed.data)
      return
    }

    if (source === 'library') {
      if (!selected) {
        setFieldErrors({ library: t('pickButtonStyleRequired') })
        return
      }
      const { buttonStyle, patch } = materializeButtonLibraryItem(theme, selected)
      setFieldErrors({})
      onSubmit(buttonStyle, patch)
      onOpenChange(false)
      return
    }

    if (source !== 'custom') return

    const customization = finalizeElementCustomization(
      normalizeWebsiteElementCustomization(values.customization),
      defaultElementHtml('button', values.id, buttonVisualFromResolved(resolveButtonStyle(theme, values))),
      values.id,
    )
    const parsed = websiteButtonStyleSchema.safeParse({
      ...values,
      customization: hasElementCustomization(customization) ? customization : undefined,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
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
    <ThemeButtonStyleEditPanel
      theme={theme}
      values={values}
      onValuesChange={setValues}
      fieldErrors={fieldErrors}
      elementTab={elementTab}
      onElementTabChange={setElementTab}
    />
  )

  const body = isEdit
    ? customBody
    : choosing
      ? (
          <ThemeStyleLibraryChoice
            ariaLabel={t('addButtonSource')}
            libraryTitle={t('addButtonFromLibrary')}
            libraryHint={t('addButtonLibraryHint')}
            customTitle={t('addButtonCustom')}
            customHint={t('addButtonCustomHint')}
            choice={choice}
            onChoice={setChoice}
          />
        )
      : source === 'library'
        ? (
            <ThemeStyleLibraryList
              hint={t('pickButtonStyleHint')}
              fieldError={fieldErrors.library}
              listStatus={buttonLibrary.listStatus}
              listError={buttonLibrary.listError}
              items={buttonLibrary.items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyLabel={t('buttonLibraryEmptySuperAdmin')}
              renderItem={(item, selectedRow) => {
                const d = item.definition
                return (
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium"
                        style={{
                          backgroundColor: d.backgroundColorValue,
                          color: d.textColorValue,
                          border: `${d.borderWidth}px solid ${d.borderColorValue}`,
                          borderRadius: d.radius,
                        }}
                      >
                        {t('buttonPreviewLabel')}
                      </span>
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                    {selectedRow ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                  </div>
                )
              }}
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
      title={isEdit ? t('editButtonStyleTitle') : t('createButtonStyleTitle')}
      description={isEdit ? undefined : t('createButtonStyleDescription')}
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

function emptyButtonStyle(theme: WebsiteTheme, initial?: WebsiteButtonStyle): WebsiteButtonStyle {
  if (initial) {
    return {
      ...initial,
      customization: normalizeWebsiteElementCustomization(initial.customization),
    }
  }
  return {
    id: nanoid(8),
    name: '',
    backgroundColorId: theme.colors[0]?.id ?? '',
    textColorId: theme.colors[1]?.id ?? theme.colors[0]?.id ?? '',
    textStyleId: theme.textStyles[0]?.id ?? '',
    borderColorId: '',
    borderWidth: 0,
    radius: 6,
    customization: emptyWebsiteElementCustomization(),
  }
}
