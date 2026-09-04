import { useEffect, useRef, useState } from 'react'
import { sendPlatformPeerDialogRequest } from './embedUrl'
import { writePeerPanelDraft } from './peerPanelDraft'
import {
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogResultMessage,
  type PlatformDialogSizePreset,
  type PlatformPeerDialogVariant,
} from './types'

function createPeerDialogRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `peer-dialog-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export type UseRequestPlatformPeerDialogOptions = {
  /** Null/undefined when not embedded — hook is a no-op. */
  parentOrigin: string | null | undefined
  open: boolean
  /** Bump to re-open while `open` stays true. */
  openKey?: number
  path: string
  title: string
  description?: string
  sizeWidth: PlatformDialogSizePreset
  sizeHeight: PlatformDialogSizePreset
  /** Host chrome: `dialog` (default) or shell `alert` (no iframe). */
  variant?: PlatformPeerDialogVariant
  cancelLabel?: string
  /** Optional host footer secondary (e.g. wizard Previous). */
  secondaryLabel?: string
  /**
   * Host footer primary label.
   * Omit or pass `null` for Close-only footers (no primary button).
   */
  submitLabel?: string | null
  /**
   * Optional origin for the dialog body iframe (cross-peer dialogs).
   * Host must allowlist this origin (e.g. Design when Identity opens a fill dialog).
   */
  bodyOrigin?: string
  /** Panel variant: initial filter draft for the embed body (sessionStorage). */
  panelDraft?: unknown
  onResult?: (payload?: unknown) => void
  onCancel?: (reason?: string) => void
}

export type UseRequestPlatformPeerDialogResult = {
  /** True when a host dialog should be used instead of a local CustomDialog. */
  isHosted: boolean
  /** Active host request id while `open` in embed mode. */
  requestId: string | null
}

/**
 * When embedded in WebOnOne, open a core-hosted peer dialog instead of a local CustomDialog.
 * Standalone: `isHosted` is false — caller renders its own dialog.
 */
export function useRequestPlatformPeerDialog(
  options: UseRequestPlatformPeerDialogOptions,
): UseRequestPlatformPeerDialogResult {
  const {
    parentOrigin,
    open,
    openKey = 0,
    path,
    title,
    description,
    sizeWidth,
    sizeHeight,
    variant,
    cancelLabel,
    secondaryLabel,
    submitLabel,
    bodyOrigin,
    panelDraft,
    onResult,
    onCancel,
  } = options

  const isHosted = Boolean(parentOrigin)
  const [requestId, setRequestId] = useState<string | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const panelDraftRef = useRef(panelDraft)
  const onResultRef = useRef(onResult)
  const onCancelRef = useRef(onCancel)

  panelDraftRef.current = panelDraft

  useEffect(() => {
    onResultRef.current = onResult
    onCancelRef.current = onCancel
  }, [onCancel, onResult])

  useEffect(() => {
    if (!parentOrigin || !open) {
      requestIdRef.current = null
      setRequestId(null)
      return
    }

    const nextRequestId = createPeerDialogRequestId()
    requestIdRef.current = nextRequestId
    setRequestId(nextRequestId)
    if (panelDraftRef.current !== undefined) {
      writePeerPanelDraft(nextRequestId, panelDraftRef.current)
    }
    sendPlatformPeerDialogRequest(parentOrigin, {
      requestId: nextRequestId,
      path,
      title,
      description,
      sizeWidth,
      sizeHeight,
      variant,
      cancelLabel,
      secondaryLabel,
      submitLabel,
      bodyOrigin,
    })
  }, [
    bodyOrigin,
    cancelLabel,
    description,
    open,
    openKey,
    parentOrigin,
    path,
    secondaryLabel,
    sizeHeight,
    sizeWidth,
    submitLabel,
    title,
    variant,
  ])

  useEffect(() => {
    const activeRequestId = requestIdRef.current
    if (!parentOrigin || !open || !activeRequestId) {
      return
    }
    if (panelDraftRef.current !== undefined) {
      writePeerPanelDraft(activeRequestId, panelDraftRef.current)
    }
  }, [open, parentOrigin, panelDraft])

  useEffect(() => {
    if (!parentOrigin) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }

      const requestId = requestIdRef.current
      if (!requestId) {
        return
      }

      if (
        isPlatformPeerDialogResultMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        requestIdRef.current = null
        setRequestId(null)
        onResultRef.current?.(event.data.payload)
        return
      }

      if (
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        requestIdRef.current = null
        setRequestId(null)
        onCancelRef.current?.(event.data.reason)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  return { isHosted, requestId }
}
