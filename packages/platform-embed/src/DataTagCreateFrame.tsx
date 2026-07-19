import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import { buildDataTagCreateUrl, sendPlatformInit } from './embedUrl'
import {
  isDataTagPickerCancelMessage,
  isDataTagPickerCreatedMessage,
  isPlatformReadyMessage,
} from './types'
import type { DataTagPickerTag } from './types'

export type DataTagCreateFrameProps = {
  dataOrigin: string
  parentOrigin?: string
  scope: string
  accessToken: string | null
  isOpen: boolean
  path?: string
  title?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  onReady?: () => void
  onCreated: (tag: DataTagPickerTag) => void
  onCancel?: (reason?: string) => void
}

export const DataTagCreateFrame = forwardRef<HTMLIFrameElement, DataTagCreateFrameProps>(
  function DataTagCreateFrame(
    {
      dataOrigin,
      parentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
      scope,
      accessToken,
      isOpen,
      path,
      title = 'Add new tag',
      className,
      onLoad,
      onError,
      onReady,
      onCreated,
      onCancel,
    },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLIFrameElement>(null)

    const dataOriginNormalized = useMemo(() => new URL(dataOrigin).origin, [dataOrigin])
    const src = useMemo(
      () =>
        buildDataTagCreateUrl({
          dataOrigin,
          parentOrigin,
          scope,
          path,
        }),
      [dataOrigin, parentOrigin, path, scope],
    )

    const setIframeRef = useCallback(
      (node: HTMLIFrameElement | null) => {
        internalRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef],
    )

    useEffect(() => {
      if (!isOpen) {
        return
      }

      function getFrame(): HTMLIFrameElement | null {
        return internalRef.current
      }

      function deliverInit() {
        const iframe = getFrame()
        if (!iframe || !accessToken) {
          return
        }
        sendPlatformInit(iframe, dataOriginNormalized, accessToken)
      }

      function handleLoad() {
        deliverInit()
        onLoad?.()
      }

      function handleMessage(event: MessageEvent) {
        const iframe = getFrame()
        if (
          !iframe ||
          event.origin !== dataOriginNormalized ||
          event.source !== iframe.contentWindow
        ) {
          return
        }

        if (isPlatformReadyMessage(event.data)) {
          deliverInit()
          onReady?.()
          return
        }

        if (isDataTagPickerCreatedMessage(event.data) && event.data.scope === scope) {
          onCreated(event.data.tag)
          return
        }

        if (isDataTagPickerCancelMessage(event.data) && event.data.scope === scope) {
          onCancel?.(event.data.reason)
        }
      }

      const iframe = getFrame()
      iframe?.addEventListener('load', handleLoad)
      window.addEventListener('message', handleMessage)

      return () => {
        iframe?.removeEventListener('load', handleLoad)
        window.removeEventListener('message', handleMessage)
      }
    }, [accessToken, dataOriginNormalized, isOpen, onCancel, onCreated, onLoad, onReady, scope, src])

    if (!isOpen) {
      return null
    }

    return (
      <iframe
        ref={setIframeRef}
        src={src}
        title={title}
        className={className ?? 'block h-full min-h-0 w-full border-0 bg-transparent'}
        onError={onError}
      />
    )
  },
)
