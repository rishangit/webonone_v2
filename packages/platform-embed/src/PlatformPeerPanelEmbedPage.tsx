import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import {
  getPlatformEmbedParentOrigin,
  sendPlatformPeerDialogDismiss,
} from './embedUrl'
import { PLATFORM_EMBED_QUERY } from './types'
import { readPeerPanelDraft } from './peerPanelDraft'

function readEmbedSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }
  return new URLSearchParams(window.location.search)
}

export type PlatformPeerPanelEmbedPageProps<T> = {
  isAllowedParentOrigin: (origin: string) => boolean
  children: (context: {
    parentOrigin: string
    requestId: string
    initialDraft: T | null
    onClose: () => void
  }) => ReactNode
}

function PlatformPeerPanelEmbedPage<T>({
  isAllowedParentOrigin,
  children,
}: PlatformPeerPanelEmbedPageProps<T>) {
  const searchParams = readEmbedSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer panel embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const initialDraft = readPeerPanelDraft<T>(requestId)

  return (
    <>
      {children({
        parentOrigin,
        requestId,
        initialDraft,
        onClose: () => sendPlatformPeerDialogDismiss(parentOrigin, requestId),
      })}
    </>
  )
}

export { PlatformPeerPanelEmbedPage }
