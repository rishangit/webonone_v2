import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ColorLibraryAddDialog } from '../components/ColorLibraryAddDialog'
import { ThemeColorPaletteAddDialog } from '../components/theme-editor/ThemeColorPaletteAddDialog'
import { ThemeColorPaletteEditDialog } from '../components/ThemeColorPaletteEditDialog'
import type { ThemeColorPaletteEditSection } from '../components/ThemeColorPaletteItemEditor'
import { websiteColorLibraryActions, websiteThemesActions } from '../store'
import { applyThemeChrome } from '../utils/websitePalette'
import { readThemeDraft, writeThemeDraft } from '../utils/themeDraftStorage'
import type { WebsiteColorToken } from '../types'

function EmbedUnavailable() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-sm">
        <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
      </Alert>
    </div>
  )
}

function parseEditSection(value: string | null): ThemeColorPaletteEditSection | null {
  if (value === 'overview' || value === 'colors') return value
  return null
}

export function WebsiteColorLibraryDialogEmbedPage() {
  const { itemId } = useParams<{ itemId?: string }>()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const item = itemId ? (colorLibrary.items.find((entry) => entry.id === itemId) ?? null) : null

  useEffect(() => {
    if (!itemId) return
    dispatch(websiteColorLibraryActions.loadListRequested({ page: 1, pageSize: 200, force: true }))
  }, [dispatch, itemId])

  if (!parentOrigin || !requestId) return <EmbedUnavailable />
  if (itemId && colorLibrary.listStatus === 'loading' && !item) {
    return <div className="min-h-[200px]" />
  }
  if (itemId && colorLibrary.listStatus !== 'loading' && !item) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{colorLibrary.listError ?? 'Palette not found.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ColorLibraryAddDialog
      open
      chrome="embed-page"
      item={item}
      onOpenChange={(open) => {
        if (!open) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
    />
  )
}

export function WebsiteThemeColorPaletteAddEmbedPage() {
  const { themeId = '' } = useParams<{ themeId: string }>()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { detail } = useAppSelector((s) => s.websiteThemes)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const draft = useMemo(() => (themeId ? readThemeDraft(themeId) : null), [themeId])
  const theme = draft ?? (detail?.id === themeId ? detail : null)

  useEffect(() => {
    if (!draft && themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, draft, themeId])

  if (!parentOrigin || !requestId) return <EmbedUnavailable />
  if (!theme) return <div className="min-h-[200px]" />

  const appliedLibraryPaletteIds = (theme.colorPalettes ?? [])
    .map((palette) => palette.sourceLibraryPaletteId)
    .filter((id): id is string => Boolean(id))

  return (
    <ThemeColorPaletteAddDialog
      open
      chrome="embed-page"
      themeId={theme.id}
      appliedLibraryPaletteIds={appliedLibraryPaletteIds}
      onOpenChange={(open) => {
        if (!open) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onApply={() => {}}
    />
  )
}

export function WebsiteThemeColorPaletteEditEmbedPage() {
  const { themeId = '', paletteId = '' } = useParams<{ themeId: string; paletteId: string }>()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { detail } = useAppSelector((s) => s.websiteThemes)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const section = parseEditSection(searchParams.get('section'))
  const draft = useMemo(() => (themeId ? readThemeDraft(themeId) : null), [themeId])
  const theme = draft ?? (detail?.id === themeId ? detail : null)

  useEffect(() => {
    if (!draft && themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, draft, themeId])

  if (!parentOrigin || !requestId || !section) return <EmbedUnavailable />
  if (!theme) return <div className="min-h-[200px]" />

  const paletteRef = theme.colorPalettes.find((entry) => entry.id === paletteId) ?? null
  if (!paletteRef) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>Palette not found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const paletteColorDrafts = paletteRef.colors.map((color, index) => ({
    id: String(index + 1),
    name: color.name,
    value: color.value,
  }))
  const takenColorValues = theme.colorPalettes.flatMap((entry) => entry.colors.map((color) => color.value))

  return (
    <ThemeColorPaletteEditDialog
      open
      chrome="embed-page"
      themeId={theme.id}
      paletteId={paletteRef.id}
      section={section}
      paletteName={paletteRef.name}
      colors={paletteColorDrafts}
      takenColorValues={takenColorValues}
      onOpenChange={(open) => {
        if (!open) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSaveOverview={(name) => {
        const next = {
          ...theme,
          colorPalettes: theme.colorPalettes.map((entry) =>
            entry.id === paletteRef.id ? { ...entry, name } : entry,
          ),
        }
        writeThemeDraft(next)
      }}
      onSaveColors={(nextColors: WebsiteColorToken[]) => {
        const next = applyThemeChrome({
          ...theme,
          colorPalettes: theme.colorPalettes.map((entry) =>
            entry.id === paletteRef.id
              ? {
                  ...entry,
                  colors: nextColors.map((color) => ({ name: color.name, value: color.value })),
                }
              : entry,
          ),
        })
        writeThemeDraft(next)
      }}
    />
  )
}
