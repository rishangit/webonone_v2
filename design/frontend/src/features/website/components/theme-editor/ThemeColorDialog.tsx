import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { ChevronRight, Library, Plus } from 'lucide-react'
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
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteColorTokenSchema } from '../../schemas/websiteThemeSchemas'
import { parseLibraryPaletteApplyPayload } from '../../utils/websitePalette'
import type { WebsiteColorToken } from '../../types'
import { paletteToSwatches, themeIncludesPalette } from '../../utils/colorLibraryPalette'
import { WebsiteSourceChoice, WebsiteSourceChoiceGrid } from '../WebsiteSourceChoice'
import { ThemeColorLibraryPicker } from './ThemeColorLibraryPicker'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'

type ColorSource = 'library' | 'custom'

const COLOR_LIBRARY_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

function normalizeColorValue(value: string): string {
  return value.trim().toLowerCase()
}

export function ThemeColorDialog({
  open,
  themeId,
  initial,
  takenColorValues = [],
  appliedLibraryPaletteIds = [],
  onOpenChange,
  onSubmit,
  onApplyPalette,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  initial?: WebsiteColorToken
  takenColorValues?: string[]
  appliedLibraryPaletteIds?: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (color: WebsiteColorToken) => void
  onApplyPalette?: (
    swatches: string[],
    colorNames: string[],
    meta?: { sourceLibraryPaletteId: string; paletteName: string },
  ) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [choice, setChoice] = useState<ColorSource | null>(null)
  const [source, setSource] = useState<ColorSource | null>(null)
  const [name, setName] = useState(initial?.name ?? '')
  const [value, setValue] = useState(initial?.value ?? '#111827')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const dialogSize = isEdit ? WEBSITE_PAGE_DIALOG_SIZE : COLOR_LIBRARY_DIALOG_SIZE
  const choosing = !isEdit && source === null
  const taken = new Set(
    takenColorValues
      .filter((colorValue) => colorValue && normalizeColorValue(colorValue) !== normalizeColorValue(initial?.value ?? ''))
      .map(normalizeColorValue),
  )

  const selected = colorLibrary.items.find((color) => color.id === selectedId) ?? null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${themeId}/colors/${initial.id}`
      : `/embed/dialogs/website/themes/${themeId}/colors/create`,
    title: isEdit ? t('editColorTitle') : t('createColorTitle'),
    description: isEdit ? undefined : t('createColorDescription'),
    submitLabel: isEdit ? tc('save') : tc('next'),
    ...dialogSize,
    onResult: (payload) => {
      const paletteApply = parseLibraryPaletteApplyPayload(payload)
      if (paletteApply) {
        if (onApplyPalette) {
          onApplyPalette(
            paletteApply.swatches,
            paletteApply.colorNames,
            paletteApply.sourceLibraryPaletteId && paletteApply.paletteName
              ? {
                  sourceLibraryPaletteId: paletteApply.sourceLibraryPaletteId,
                  paletteName: paletteApply.paletteName,
                }
              : undefined,
          )
        }
        onOpenChange(false)
        return
      }
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
    setChoice(null)
    setSource(null)
    setSelectedId(null)
    setFieldErrors({})
  }, [chrome, initial, open])

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
  }, [
    choice,
    choosing,
    dialogRequestId,
    isEdit,
    parentOrigin,
    selected,
    source,
    t,
    tc,
  ])

  function confirmChoice() {
    if (!choice) return
    setSource(choice)
    setFieldErrors({})
  }

  function backToChoice() {
    setSource(null)
    setFieldErrors({})
  }

  function handlePrimary() {
    if (choosing) {
      confirmChoice()
      return
    }
    submit()
  }

  function submit() {
    if (isEdit && initial) {
      const parsed = websiteColorTokenSchema.safeParse({
        id: initial.id,
        name: name.trim() || initial.name,
        value: initial.value,
      })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      onSubmit(parsed.data)
      return
    }

    if (source !== 'library' && source !== 'custom') return

    if (source === 'library') {
      if (!selected) {
        setFieldErrors({ library: t('pickColorPaletteRequired') })
        return
      }
      if (
        appliedLibraryPaletteIds.includes(selected.id) ||
        themeIncludesPalette(takenColorValues, selected.palette)
      ) {
        setFieldErrors({ library: t('colorPaletteAlreadyOnTheme') })
        return
      }
      if (!onApplyPalette) {
        setFieldErrors({ library: t('colorLibraryApplyFailed') })
        return
      }
      setFieldErrors({})
      onApplyPalette(
        paletteToSwatches(selected.palette),
        selected.palette.colors.map((entry) => entry.name),
        { sourceLibraryPaletteId: selected.id, paletteName: selected.name },
      )
      onOpenChange(false)
      return
    }

    if (taken.has(normalizeColorValue(value))) {
      setFieldErrors({ value: t('colorAlreadyOnTheme') })
      return
    }
    const parsed = websiteColorTokenSchema.safeParse({
      id: nanoid(8),
      name: name.trim(),
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
    onSubmit: handlePrimary,
    onSecondary: backToChoice,
  })

  const choiceBody = (
    <WebsiteSourceChoiceGrid ariaLabel={t('addColorSource')}>
      <WebsiteSourceChoice
        selected={choice === 'library'}
        icon={<Library className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('addColorFromLibrary')}
        hint={t('addColorPaletteLibraryHint')}
        onClick={() => {
          setChoice('library')
          setFieldErrors({})
        }}
      />
      <WebsiteSourceChoice
        selected={choice === 'custom'}
        icon={<Plus className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('addColorCustom')}
        hint={t('addColorCustomHint')}
        onClick={() => {
          setChoice('custom')
          setFieldErrors({})
        }}
      />
    </WebsiteSourceChoiceGrid>
  )

  const libraryBody = (
    <ThemeColorLibraryPicker
      appliedLibraryPaletteIds={appliedLibraryPaletteIds}
      selectedId={selectedId}
      onSelectId={(id) => {
        setSelectedId(id)
        setFieldErrors({})
      }}
      libraryError={fieldErrors.library}
      loadOnMount={open}
    />
  )

  const customBody = (
    <Form className="space-y-4">
      <FormField label={t('name')} htmlFor="theme-color-name" required error={fieldErrors.name}>
        <Input id="theme-color-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('color')} htmlFor="theme-color-value" required error={fieldErrors.value}>
        <ColorInput id="theme-color-value" value={value} onChange={setValue} />
      </FormField>
    </Form>
  )

  const body = isEdit ? (
    <Form className="space-y-4">
      <FormField label={t('name')} htmlFor="theme-color-name" required error={fieldErrors.name}>
        <Input id="theme-color-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('color')} htmlFor="theme-color-value">
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-10 shrink-0 rounded-md border border-[hsl(var(--glass-border))]"
            style={{ backgroundColor: initial?.value }}
            aria-hidden
          />
          <Input id="theme-color-value" value={initial?.value ?? ''} readOnly />
        </div>
      </FormField>
      <p className="text-sm text-muted-foreground">{t('editColorNameHint')}</p>
    </Form>
  ) : (
    choosing ? choiceBody : source === 'library' ? libraryBody : customBody
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
      sizeWidth={dialogSize.sizeWidth}
      sizeHeight={dialogSize.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          {!isEdit && !choosing ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={backToChoice}
            >
              {tc('previous')}
            </Button>
          ) : null}
          {choosing ? (
            <Button type="button" className="h-10 px-4" disabled={!choice} onClick={confirmChoice}>
              {tc('next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 px-4"
              onClick={submit}
              disabled={!isEdit && source === 'library' && !selected}
            >
              {isEdit ? tc('save') : t('create')}
            </Button>
          )}
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
