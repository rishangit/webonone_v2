import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  buildIdentityUserPickerUrl,
  sendIdentityUserPickerSetSelection,
  sendPlatformInit,
} from './embedUrl'
import {
  isIdentityUserPickerCancelMessage,
  isIdentityUserPickerSelectionChangeMessage,
  isPlatformReadyMessage,
} from './types'
import type { IdentityUserPickerMode, IdentityUserPickerUser } from './types'

export type IdentityUserPickerFrameProps = {
  identityOrigin: string
  parentOrigin?: string
  scope: string
  accessToken: string | null
  isOpen: boolean
  mode?: IdentityUserPickerMode
  /** Currently selected users to highlight when the picker opens. */
  selectedUsers?: IdentityUserPickerUser[]
  path?: string
  title?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  onReady?: () => void
  onSelectionChange: (users: IdentityUserPickerUser[]) => void
  onCancel?: (reason?: string) => void
}

export const IdentityUserPickerFrame = forwardRef<
  HTMLIFrameElement,
  IdentityUserPickerFrameProps
>(function IdentityUserPickerFrame(
  {
    identityOrigin,
    parentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
    scope,
    accessToken,
    isOpen,
    mode = 'single',
    selectedUsers = [],
    path,
    title = 'Select user',
    className,
    onLoad,
    onError,
    onReady,
    onSelectionChange,
    onCancel,
  },
  forwardedRef,
) {
  const internalRef = useRef<HTMLIFrameElement>(null)
  const selectedUsersRef = useRef(selectedUsers)
  selectedUsersRef.current = selectedUsers

  const identityOriginNormalized = useMemo(
    () => new URL(identityOrigin).origin,
    [identityOrigin],
  )
  const src = useMemo(
    () =>
      buildIdentityUserPickerUrl({
        identityOrigin,
        parentOrigin,
        scope,
        path,
        mode,
      }),
    [identityOrigin, mode, parentOrigin, path, scope],
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
        sendPlatformInit(iframe, identityOriginNormalized, accessToken)
      }
      sendIdentityUserPickerSetSelection(
        iframe,
        identityOriginNormalized,
        scope,
        selectedUsersRef.current,
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
        event.origin !== identityOriginNormalized ||
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
        isIdentityUserPickerSelectionChangeMessage(event.data) &&
        event.data.scope === scope
      ) {
        onSelectionChange(event.data.users)
        return
      }

      if (isIdentityUserPickerCancelMessage(event.data) && event.data.scope === scope) {
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
    identityOriginNormalized,
    isOpen,
    onCancel,
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
})
