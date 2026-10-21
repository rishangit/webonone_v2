import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Check, ChevronRight, Library, Plus } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Callout,
  CalloutDescription,
  CalloutTitle,
  CustomDialog,
  Form,
  FormField,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
  cn,
  itemListRowActiveClassName,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteFontTokenSchema } from '../../schemas/websiteThemeSchemas'
import { websiteFontLibraryActions, websiteFontLibraryCreateActions } from '../../store'
import type { WebsiteFontLibraryItem, WebsiteFontToken } from '../../types'
import { themeFontFamilyStyle } from '../../utils/themeFontPreview'
import { normalizeGoogleFontInput, parseGoogleFontFamily } from '../../utils/parseGoogleFontFamily'
import { WebsiteSourceChoice, WebsiteSourceChoiceGrid } from '../WebsiteSourceChoice'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'

type FontSource = 'library' | 'custom'

const FONT_LIBRARY_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

export function ThemeFontDialog({
  open,
  themeId,
  initial,
  takenGoogleFontUrls = [],
  onOpenChange,
  onSubmit,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  initial?: WebsiteFontToken
  takenGoogleFontUrls?: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (font: WebsiteFontToken) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const fontLibrary = useAppSelector((state) => state.websiteFontLibrary)
  const fontLibraryCreate = useAppSelector((state) => state.websiteFontLibraryCreate)
  const isSuperAdmin = useAppSelector((state) => state.auth.user?.role === 'super_admin')
  const [pendingLibraryFont, setPendingLibraryFont] = useState<WebsiteFontToken | null>(null)
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEdit = Boolean(initial)
  const [choice, setChoice] = useState<FontSource | null>(null)
  const [source, setSource] = useState<FontSource | null>(null)
  const [name, setName] = useState(initial?.name ?? '')
  const [googleFontUrl, setGoogleFontUrl] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const dialogSize = isEdit ? WEBSITE_PAGE_DIALOG_SIZE : FONT_LIBRARY_DIALOG_SIZE
  const choosing = !isEdit && source === null
  const taken = new Set(
    takenGoogleFontUrls.filter((url) => url && url !== initial?.googleFontUrl),
  )
  const takenFamilies = new Set(
    [...taken].map((url) => parseGoogleFontFamily(url)).filter((family): family is string => Boolean(family)),
  )
  function isLibraryFontTaken(font: { googleFontUrl: string; family: string }) {
    return taken.has(font.googleFontUrl) || takenFamilies.has(font.family)
  }
  const selected = fontLibrary.items.find((font) => font.id === selectedId) ?? null
  const customUrl = normalizeGoogleFontInput(googleFontUrl)
  const customFamily = parseGoogleFontFamily(customUrl)

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: initial
      ? `/embed/dialogs/website/themes/${themeId}/fonts/${initial.id}`
      : `/embed/dialogs/website/themes/${themeId}/fonts/create`,
    title: isEdit ? t('editFontTitle') : t('createFontTitle'),
    description: isEdit ? undefined : t('createFontDescription'),
    submitLabel: isEdit ? tc('save') : tc('next'),
    ...dialogSize,
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
    setGoogleFontUrl('')
    setChoice(null)
    setSource(null)
    setSelectedId(null)
    setFieldErrors({})
    setPendingLibraryFont(null)
    dispatch(websiteFontLibraryCreateActions.createReset())
  }, [chrome, dispatch, initial, open])

  useEffect(() => {
    if (isEdit || source !== 'library' || (!open && chrome === 'dialog')) return
    dispatch(websiteFontLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [chrome, dispatch, isEdit, open, source])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    const waitingForChoice = choosing ? !choice : source === 'library' && !selected
    const savingLibrary = fontLibraryCreate.status === 'saving'
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      waitingForChoice || savingLibrary,
      isEdit ? tc('save') : choosing ? tc('next') : t('create'),
      { secondaryLabel: choosing || isEdit ? null : tc('previous') },
    )
  }, [choice, choosing, dialogRequestId, fontLibraryCreate.status, isEdit, parentOrigin, selected, source, t, tc])

  useEffect(() => {
    if (!pendingLibraryFont) return
    if (fontLibraryCreate.status === 'succeeded') {
      const font = pendingLibraryFont
      setPendingLibraryFont(null)
      dispatch(websiteFontLibraryCreateActions.createReset())
      onSubmit(font)
      return
    }
    if (fontLibraryCreate.status === 'error') {
      setPendingLibraryFont(null)
      toast({
        title: t('fontLibrarySaveFailed'),
        description: fontLibraryCreate.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteFontLibraryCreateActions.createReset())
    }
  }, [dispatch, fontLibraryCreate.error, fontLibraryCreate.status, onSubmit, pendingLibraryFont, t, toast])

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
      const parsed = websiteFontTokenSchema.safeParse({
        id: initial.id,
        name: name.trim() || initial.family,
        googleFontUrl: initial.googleFontUrl,
        family: initial.family,
        sourceLibraryId: initial.sourceLibraryId ?? null,
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
        setFieldErrors({ library: t('pickFontRequired') })
        return
      }
      if (isLibraryFontTaken(selected)) {
        setFieldErrors({ library: t('fontAlreadyOnTheme') })
        return
      }
      const parsed = websiteFontTokenSchema.safeParse({
        id: nanoid(8),
        name: selected.name,
        googleFontUrl: selected.googleFontUrl,
        family: selected.family,
        sourceLibraryId: selected.id,
      })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      onSubmit(parsed.data)
      return
    }

    if (taken.has(customUrl)) {
      setFieldErrors({ googleFontUrl: t('fontAlreadyOnTheme') })
      return
    }
    const parsed = websiteFontTokenSchema.safeParse({
      id: nanoid(8),
      name: name.trim() || customFamily || '',
      googleFontUrl: customUrl,
      family: customFamily ?? '',
      sourceLibraryId: null,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    if (isSuperAdmin) {
      setPendingLibraryFont(parsed.data)
      dispatch(
        websiteFontLibraryCreateActions.createRequested({
          name: parsed.data.name,
          googleFontUrl: parsed.data.googleFontUrl,
          family: parsed.data.family,
        }),
      )
      return
    }
    onSubmit(parsed.data)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: handlePrimary,
    onSecondary: backToChoice,
  })

  const customPreview = themeFontFamilyStyle(customFamily ?? undefined)
  const editPreview = themeFontFamilyStyle(initial?.family)

  const choiceBody = (
    <WebsiteSourceChoiceGrid ariaLabel={t('addFontSource')}>
      <WebsiteSourceChoice
        selected={choice === 'library'}
        icon={<Library className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('addFontFromLibrary')}
        hint={t('addFontLibraryHint')}
        onClick={() => {
          setChoice('library')
          setFieldErrors({})
        }}
      />
      <WebsiteSourceChoice
        selected={choice === 'custom'}
        icon={<Plus className="h-5 w-5 text-foreground" aria-hidden />}
        title={t('addFontCustom')}
        hint={t('addFontCustomHint')}
        onClick={() => {
          setChoice('custom')
          setFieldErrors({})
        }}
      />
    </WebsiteSourceChoiceGrid>
  )

  const libraryBody = (
    <div className="space-y-3">
      {fontLibrary.items.map((font) =>
        font.googleFontUrl ? <link key={font.id} rel="stylesheet" href={font.googleFontUrl} /> : null,
      )}
      {isSuperAdmin ? (
        <Callout>
          <CalloutTitle>{t('fontLibrarySuperAdminTitle')}</CalloutTitle>
          <CalloutDescription>{t('fontLibrarySuperAdminMessage')}</CalloutDescription>
        </Callout>
      ) : (
        <p className="text-sm text-muted-foreground">{t('pickFontHint')}</p>
      )}
      {fieldErrors.library ? (
        <p className="text-sm text-destructive" role="alert">
          {fieldErrors.library}
        </p>
      ) : null}
      {fontLibrary.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{fontLibrary.listError ?? t('fontLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      {fontLibrary.listStatus === 'loading' && fontLibrary.items.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : fontLibrary.items.length === 0 ? (
        <ItemListEmpty>{isSuperAdmin ? t('fontLibraryEmptySuperAdmin') : t('fontLibraryEmpty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {fontLibrary.items.map((font) => (
            <FontLibraryRow
              key={font.id}
              font={font}
              selected={selectedId === font.id}
              alreadyAdded={isLibraryFontTaken(font)}
              alreadyAddedLabel={t('fontAlreadyOnTheme')}
              sample={t('textPreviewSample')}
              onSelect={() => {
                if (isLibraryFontTaken(font)) return
                setSelectedId(font.id)
                setFieldErrors({})
              }}
            />
          ))}
        </ItemList>
      )}
    </div>
  )

  const customBody = (
    <Form className="space-y-4">
      {customFamily && customUrl ? <link rel="stylesheet" href={customUrl} /> : null}
      <FormField label={t('styleName')} htmlFor="theme-font-name" required error={fieldErrors.name}>
        <Input id="theme-font-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('googleFontUrl')} htmlFor="theme-font-url" required error={fieldErrors.googleFontUrl}>
        <Input
          id="theme-font-url"
          value={googleFontUrl}
          onChange={(event) => {
            setGoogleFontUrl(event.target.value)
            setFieldErrors((current) => ({ ...current, googleFontUrl: undefined }))
          }}
          placeholder="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
        />
      </FormField>
      <p className="text-sm text-muted-foreground">{t('googleFontUrlHint')}</p>
      {isSuperAdmin ? <p className="text-sm text-muted-foreground">{t('customFontLibraryNote')}</p> : null}
      <FormField label={t('fontFamily')} htmlFor="theme-font-family" error={fieldErrors.family}>
        <Input id="theme-font-family" value={customFamily ?? ''} readOnly style={customPreview} />
        {customFamily ? (
          <p className="text-sm text-muted-foreground" style={customPreview}>
            {t('textPreviewSample')}
          </p>
        ) : null}
      </FormField>
    </Form>
  )

  const body = isEdit ? (
    <Form className="space-y-4">
      {initial?.googleFontUrl ? <link rel="stylesheet" href={initial.googleFontUrl} /> : null}
      <FormField label={t('styleName')} htmlFor="theme-font-name" required error={fieldErrors.name}>
        <Input id="theme-font-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label={t('googleFontUrl')} htmlFor="theme-font-url">
        <Input id="theme-font-url" value={initial?.googleFontUrl ?? ''} readOnly />
      </FormField>
      <FormField label={t('fontFamily')} htmlFor="theme-font-family">
        <Input id="theme-font-family" value={initial?.family ?? ''} readOnly style={editPreview} />
        {initial?.family ? (
          <p className="text-sm text-muted-foreground" style={editPreview}>
            {t('textPreviewSample')}
          </p>
        ) : null}
      </FormField>
      <p className="text-sm text-muted-foreground">{t('editFontNameHint')}</p>
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
      title={isEdit ? t('editFontTitle') : t('createFontTitle')}
      description={isEdit ? undefined : t('createFontDescription')}
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
              disabled={fontLibraryCreate.status === 'saving' || (!isEdit && source === 'library' && !selected)}
            >
              {fontLibraryCreate.status === 'saving' ? t('creating') : isEdit ? tc('save') : t('create')}
            </Button>
          )}
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

function FontLibraryRow({
  font,
  selected,
  alreadyAdded,
  alreadyAddedLabel,
  sample,
  onSelect,
}: {
  font: WebsiteFontLibraryItem
  selected: boolean
  alreadyAdded: boolean
  alreadyAddedLabel: string
  sample: string
  onSelect: () => void
}) {
  const previewStyle = themeFontFamilyStyle(font.family)
  const marked = selected || alreadyAdded
  return (
    <ItemListItem
      role="button"
      tabIndex={alreadyAdded ? -1 : 0}
      aria-pressed={marked}
      aria-disabled={alreadyAdded}
      className={cn('cursor-pointer transition-colors', marked && itemListRowActiveClassName)}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (alreadyAdded) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <ItemListContent>
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-background text-lg leading-none"
            style={previewStyle}
            aria-hidden
          >
            Aa
          </span>
          <div className="min-w-0">
            <p className="font-medium">{font.name}</p>
            <p className="truncate text-base leading-snug text-muted-foreground" style={previewStyle}>
              {alreadyAdded ? alreadyAddedLabel : sample}
            </p>
          </div>
        </div>
      </ItemListContent>
      {marked ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
    </ItemListItem>
  )
}
