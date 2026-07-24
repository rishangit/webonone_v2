import { useEffect, useRef } from 'react'
import { sendPlatformPeerDialogRequest } from './embedUrl'
import {
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogResultMessage,
  type PlatformDialogSizePreset,
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
  cancelLabel?: string
  /** Optional host footer secondary (e.g. wizard Previous). */
  secondaryLabel?: string
  submitLabel: string
  onResult?: (payload?: unknown) => void
  onCancel?: (reason?: string) => void
}

export type UseRequestPlatformPeerDialogResult = {
  /** True when a host dialog should be used instead of a local CustomDialog. */
  isHosted: boolean
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
    cancelLabel,
    secondaryLabel,
    submitLabel,
    onResult,
    onCancel,
  } = options

  const isHosted = Boolean(parentOrigin)
  const requestIdRef = useRef<string | null>(null)
  const onResultRef = useRef(onResult)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onResultRef.current = onResult
    onCancelRef.current = onCancel
  }, [onCancel, onResult])

  useEffect(() => {
    if (!parentOrigin || !open) {
      requestIdRef.current = null
      return
    }

    const requestId = createPeerDialogRequestId()
    requestIdRef.current = requestId
    sendPlatformPeerDialogRequest(parentOrigin, {
      requestId,
      path,
      title,
      description,
      sizeWidth,
      sizeHeight,
      cancelLabel,
      secondaryLabel,
      submitLabel,
    })
  }, [
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
  ])

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
        onResultRef.current?.(event.data.payload)
        return
      }

      if (
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        requestIdRef.current = null
        onCancelRef.current?.(event.data.reason)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  return { isHosted }
}
