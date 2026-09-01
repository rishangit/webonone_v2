import type { ReactNode } from 'react'
import { ListFilterPanel } from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from './embedSession'
import type { PeerFilterPanelResult } from './peerPanelDraft'
import { useRequestPlatformPeerPanel } from './useRequestPlatformPeerPanel'

function readEmbedSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }
  return new URLSearchParams(window.location.search)
}

export type PlatformHostedListFilterPanelProps<T = unknown> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Peer embed body route, e.g. `/embed/panels/tags/filters`. */
  path: string
  title?: string
  children: ReactNode
  onApply?: (draft?: T) => void
  onClear?: () => void
  className?: string
  /** When set, validates parent origin. When omitted, reads from URL/session. */
  isAllowedParentOrigin?: (origin: string) => boolean
  /** Explicit parent origin (skips URL resolution). */
  parentOrigin?: string | null
  /** Current filter draft — sent to embed body when hosted. */
  draft?: T
  /** Apply filter values returned from the hosted panel. */
  onDraftApply?: (draft: T) => void
}

function PlatformHostedListFilterPanel<T>({
  open,
  onOpenChange,
  path,
  title = 'Filters',
  children,
  onApply,
  onClear,
  className,
  isAllowedParentOrigin,
  parentOrigin: parentOriginProp,
  draft,
  onDraftApply,
}: PlatformHostedListFilterPanelProps<T>) {
  const searchParams = readEmbedSearchParams()
  const parentOrigin =
    parentOriginProp !== undefined
      ? parentOriginProp
      : isAllowedParentOrigin
        ? resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
        : null

  const { isHosted } = useRequestPlatformPeerPanel({
    parentOrigin,
    open,
    path,
    title,
    submitLabel: 'Apply',
    secondaryLabel: onClear ? 'Clear' : undefined,
    panelDraft: draft,
    onResult: (payload) => {
      const result = payload as PeerFilterPanelResult<T> | undefined
      if (result?.action === 'clear') {
        if (result.draft !== undefined) {
          onDraftApply?.(result.draft)
        }
        onClear?.()
        onOpenChange(false)
        return
      }
      if (result?.draft !== undefined) {
        onDraftApply?.(result.draft)
        onApply?.(result.draft)
      } else {
        onApply?.()
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  if (isHosted) {
    return null
  }

  return (
    <ListFilterPanel
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onApply={onApply}
      onClear={onClear}
      className={className}
    >
      {children}
    </ListFilterPanel>
  )
}

export { PlatformHostedListFilterPanel }
