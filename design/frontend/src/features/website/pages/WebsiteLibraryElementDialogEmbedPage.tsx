import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteApi } from '../api'
import { ButtonLibraryAddDialog } from '../components/ButtonLibraryAddDialog'
import { TextLibraryAddDialog } from '../components/TextLibraryAddDialog'
import { parseElementEditorTab } from '../components/WebsiteElementEditorTabs'
import type { WebsiteButtonLibraryItem, WebsiteTextLibraryItem } from '../types'

function EmbedUnavailable() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-sm">
        <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
      </Alert>
    </div>
  )
}

export function WebsiteButtonLibraryDialogEmbedPage() {
  const { itemId } = useParams<{ itemId?: string }>()
  const [searchParams] = useSearchParams()
  const [item, setItem] = useState<WebsiteButtonLibraryItem | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const initialTab = parseElementEditorTab(searchParams.get('tab'))

  useEffect(() => {
    if (!itemId) {
      setItem(null)
      setLoadError(null)
      return
    }
    let cancelled = false
    websiteApi
      .getButtonLibrary(itemId)
      .then((next) => {
        if (!cancelled) setItem(next)
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [itemId])

  if (!parentOrigin || !requestId) return <EmbedUnavailable />
  if (itemId && !item) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        {loadError ? (
          <Alert variant="destructive" className="max-w-sm">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <ButtonLibraryAddDialog
      open
      chrome="embed-page"
      item={item}
      initialTab={initialTab}
      onOpenChange={(open) => {
        if (!open) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
    />
  )
}

export function WebsiteTextLibraryDialogEmbedPage() {
  const { itemId } = useParams<{ itemId?: string }>()
  const [searchParams] = useSearchParams()
  const [item, setItem] = useState<WebsiteTextLibraryItem | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const initialTab = parseElementEditorTab(searchParams.get('tab'))

  useEffect(() => {
    if (!itemId) {
      setItem(null)
      setLoadError(null)
      return
    }
    let cancelled = false
    websiteApi
      .getTextLibrary(itemId)
      .then((next) => {
        if (!cancelled) setItem(next)
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [itemId])

  if (!parentOrigin || !requestId) return <EmbedUnavailable />
  if (itemId && !item) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        {loadError ? (
          <Alert variant="destructive" className="max-w-sm">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <TextLibraryAddDialog
      open
      chrome="embed-page"
      item={item}
      initialTab={initialTab}
      onOpenChange={(open) => {
        if (!open) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
    />
  )
}
