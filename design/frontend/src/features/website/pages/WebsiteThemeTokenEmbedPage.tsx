import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ThemeButtonStyleDialog } from '../components/theme-editor/ThemeButtonStyleDialog'
import { ThemeColorDialog } from '../components/theme-editor/ThemeColorDialog'
import { ThemeFontDialog } from '../components/theme-editor/ThemeFontDialog'
import { ThemeTextStyleDialog } from '../components/theme-editor/ThemeTextStyleDialog'
import { websiteThemesActions } from '../store'
import { readThemeDraft } from '../utils/themeDraftStorage'

export type ThemeTokenKind = 'fonts' | 'colors' | 'texts' | 'buttons'

export function WebsiteThemeTokenEmbedPage({ kind }: { kind: ThemeTokenKind }) {
  const { themeId = '', tokenId } = useParams<{ themeId: string; tokenId?: string }>()
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

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!theme) {
    return <div className="min-h-[200px]" />
  }

  const origin = parentOrigin
  const onOpenChange = (next: boolean) => {
    if (!next) sendPlatformPeerDialogDismiss(origin, requestId)
  }

  function complete(payload: unknown) {
    sendPlatformPeerDialogComplete(origin, requestId, payload)
  }

  if (kind === 'fonts') {
    const initial = tokenId ? theme.fonts.find((item) => item.id === tokenId) : undefined
    if (tokenId && !initial) return <MissingToken />
    return (
      <ThemeFontDialog
        open
        chrome="embed-page"
        themeId={theme.id}
        initial={initial}
        onOpenChange={onOpenChange}
        onSubmit={complete}
      />
    )
  }

  if (kind === 'colors') {
    const initial = tokenId ? theme.colors.find((item) => item.id === tokenId) : undefined
    if (tokenId && !initial) return <MissingToken />
    return (
      <ThemeColorDialog
        open
        chrome="embed-page"
        themeId={theme.id}
        initial={initial}
        onOpenChange={onOpenChange}
        onSubmit={complete}
      />
    )
  }

  if (kind === 'texts') {
    const initial = tokenId ? theme.textStyles.find((item) => item.id === tokenId) : undefined
    if (tokenId && !initial) return <MissingToken />
    return (
      <ThemeTextStyleDialog
        open
        chrome="embed-page"
        theme={theme}
        initial={initial}
        onOpenChange={onOpenChange}
        onSubmit={complete}
      />
    )
  }

  const initial = tokenId ? theme.buttonStyles.find((item) => item.id === tokenId) : undefined
  if (tokenId && !initial) return <MissingToken />
  return (
    <ThemeButtonStyleDialog
      open
      chrome="embed-page"
      theme={theme}
      initial={initial}
      onOpenChange={onOpenChange}
      onSubmit={complete}
    />
  )
}

function MissingToken() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-sm">
        <AlertDescription>This item is missing from the theme.</AlertDescription>
      </Alert>
    </div>
  )
}
