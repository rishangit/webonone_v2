import { useEffect, type ReactNode } from 'react'
import { ListFilterPanel } from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from './embedSession'
import { subscribePeerPanelDraft } from './peerPanelDraft'
import { useRequestPlatformPeerPanel } from './useRequestPlatformPeerPanel'

function readEmbedSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }
  return new URLSearchParams(window.location.search)
}

export type PlatformHostedEndPanelProps<TDraft = unknown> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Peer embed body route, e.g. `/embed/panels/forms/field-properties`. */
  path: string
  title?: string
  children: ReactNode
  className?: string
  /** When set, validates parent origin. When omitted, reads from URL/session. */
  isAllowedParentOrigin?: (origin: string) => boolean
  /** Explicit parent origin (skips URL resolution). */
  parentOrigin?: string | null
  /** Initial/sync draft for the hosted embed body (sessionStorage). */
  panelDraft?: TDraft
  /** Live draft messages from the hosted embed body (sessionStorage). */
  onPanelDraftMessage?: (draft: unknown) => void
}

function PlatformHostedEndPanel<TDraft = unknown>({
  open,
  onOpenChange,
  path,
  title = 'Panel',
  children,
  className,
  isAllowedParentOrigin,
  parentOrigin: parentOriginProp,
  panelDraft,
  onPanelDraftMessage,
}: PlatformHostedEndPanelProps<TDraft>) {
  const searchParams = readEmbedSearchParams()
  const parentOrigin =
    parentOriginProp !== undefined
      ? parentOriginProp
      : isAllowedParentOrigin
        ? resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
        : null

  const { isHosted, requestId } = useRequestPlatformPeerPanel({
    parentOrigin,
    open,
    path,
    title,
    submitLabel: null,
    panelDraft,
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!requestId || !onPanelDraftMessage) {
      return
    }
    return subscribePeerPanelDraft(requestId, onPanelDraftMessage)
  }, [onPanelDraftMessage, requestId])

  if (isHosted) {
    return null
  }

  return (
    <ListFilterPanel
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={className}
    >
      {children}
    </ListFilterPanel>
  )
}

export { PlatformHostedEndPanel }
