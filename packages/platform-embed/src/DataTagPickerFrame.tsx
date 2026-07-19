import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  buildDataTagPickerUrl,
  sendDataTagPickerSetSelection,
  sendPlatformInit,
} from './embedUrl'
import {
  isDataTagPickerCancelMessage,
  isDataTagPickerCreateRequestMessage,
  isDataTagPickerSelectionChangeMessage,
  isPlatformReadyMessage,
} from './types'
import type { DataTagPickerMode, DataTagPickerTag } from './types'

export type DataTagPickerFrameProps = {
  dataOrigin: string
  parentOrigin?: string
  scope: string
  accessToken: string | null
  isOpen: boolean
  mode?: DataTagPickerMode
  /** Currently selected tags to highlight when the picker opens. */
  selectedTags?: DataTagPickerTag[]
  path?: string
  title?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  onReady?: () => void
  onSelectionChange: (tags: DataTagPickerTag[]) => void
  onCancel?: (reason?: string) => void
  onCreateRequest?: () => void
}

export const DataTagPickerFrame = forwardRef<HTMLIFrameElement, DataTagPickerFrameProps>(
  function DataTagPickerFrame(
    {
      dataOrigin,
      parentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
      scope,
      accessToken,
      isOpen,
      mode = 'single',
      selectedTags = [],
      path,
      title = 'Select tags',
      className,
      onLoad,
      onError,
      onReady,
      onSelectionChange,
      onCancel,
      onCreateRequest,
    },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const selectedTagsRef = useRef(selectedTags)
    selectedTagsRef.current = selectedTags

    const dataOriginNormalized = useMemo(() => new URL(dataOrigin).origin, [dataOrigin])
    const src = useMemo(
      () =>
        buildDataTagPickerUrl({
          dataOrigin,
          parentOrigin,
          scope,
          path,
          mode,
        }),
      [dataOrigin, mode, parentOrigin, path, scope],
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
        if (!iframe) {
          return
        }
        if (accessToken) {
          sendPlatformInit(iframe, dataOriginNormalized, accessToken)
        }
        sendDataTagPickerSetSelection(
          iframe,
          dataOriginNormalized,
          scope,
          selectedTagsRef.current,
        )
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

        if (
          isDataTagPickerSelectionChangeMessage(event.data) &&
          event.data.scope === scope
        ) {
          onSelectionChange(event.data.tags)
          return
        }

        if (isDataTagPickerCreateRequestMessage(event.data) && event.data.scope === scope) {
          onCreateRequest?.()
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
    }, [
      accessToken,
      dataOriginNormalized,
      isOpen,
      onCancel,
      onCreateRequest,
      onLoad,
      onReady,
      onSelectionChange,
      scope,
      src,
    ])

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
